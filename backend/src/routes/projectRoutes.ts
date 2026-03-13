import { Router, Request, Response } from 'express';
import multer from 'multer';
import { prisma } from '../server';
import { requireAuth, requireRole, AuthRequest } from '../middlewares/authMiddleware';
import { ipfsService } from '../services/ipfsService';
import { blockchainService } from '../services/blockchainService';
import { aiService } from '../services/aiService';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit
const router = Router();

// Start background AI analysis scheduler once when routes are initialized.
aiService.startScheduler();

const sendError = (
  res: Response,
  status: number,
  message: string,
  code: string,
  fieldErrors?: Record<string, string>
) => {
  return res.status(status).json({
    success: false,
    error: {
      message,
      code,
      details: fieldErrors ? { fieldErrors } : undefined,
    },
  });
};

const hasJpegSignature = (buffer: Buffer) =>
  buffer.length >= 4 &&
  buffer[0] === 0xff &&
  buffer[1] === 0xd8 &&
  buffer[buffer.length - 2] === 0xff &&
  buffer[buffer.length - 1] === 0xd9;

const hasPngSignature = (buffer: Buffer) =>
  buffer.length >= 8 &&
  buffer[0] === 0x89 &&
  buffer[1] === 0x50 &&
  buffer[2] === 0x4e &&
  buffer[3] === 0x47;

const hasPdfSignature = (buffer: Buffer) =>
  buffer.length >= 5 &&
  buffer[0] === 0x25 &&
  buffer[1] === 0x50 &&
  buffer[2] === 0x44 &&
  buffer[3] === 0x46 &&
  buffer[4] === 0x2d;

const hasZipSignature = (buffer: Buffer) =>
  buffer.length >= 4 &&
  buffer[0] === 0x50 &&
  buffer[1] === 0x4b &&
  (buffer[2] === 0x03 || buffer[2] === 0x05 || buffer[2] === 0x07) &&
  (buffer[3] === 0x04 || buffer[3] === 0x06 || buffer[3] === 0x08);

const validateProofIntegrity = (file: Express.Multer.File) => {
  const minSizeByType: Record<string, number> = {
    'image/jpeg': 1024,
    'image/png': 1024,
    'application/pdf': 256,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 1024,
  };

  const minSize = minSizeByType[file.mimetype] || 256;
  if (file.size < minSize) {
    return { ok: false, reason: `File appears too small for ${file.mimetype}` };
  }

  if (file.mimetype === 'image/jpeg' && !hasJpegSignature(file.buffer)) {
    return { ok: false, reason: 'JPEG file signature is invalid or corrupted' };
  }
  if (file.mimetype === 'image/png' && !hasPngSignature(file.buffer)) {
    return { ok: false, reason: 'PNG file signature is invalid or corrupted' };
  }
  if (file.mimetype === 'application/pdf' && !hasPdfSignature(file.buffer)) {
    return { ok: false, reason: 'PDF file signature is invalid or corrupted' };
  }
  if (
    file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' &&
    !hasZipSignature(file.buffer)
  ) {
    return { ok: false, reason: 'DOCX file signature is invalid or corrupted' };
  }

  return { ok: true };
};

const getOnChainProjectId = (project: { blockchainProjectId: number | null; projectId: string }) => {
  if (project.blockchainProjectId) return project.blockchainProjectId;
  // Backward compatibility fallback for older records.
  const match = String(project.projectId).match(/(\d+)$/);
  if (!match) return 0;
  return Number(match[1]);
};

const generateUniqueProjectId = async () => {
  let counter = (await prisma.project.count()) + 1;
  while (true) {
    const candidate = `proj-${counter.toString().padStart(3, '0')}`;
    const exists = await prisma.project.findUnique({ where: { projectId: candidate }, select: { id: true } });
    if (!exists) return candidate;
    counter++;
  }
};

// Get all projects (Public, paginated)
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          contractor: {
            select: { id: true, displayName: true, organization: true }
          },
          _count: {
            select: { proofs: true }
          }
        }
      }),
      prisma.project.count()
    ]);

    res.json({
      success: true,
      data: {
        items: projects,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Fetch projects error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch projects' } });
  }
});

// Get single project details (Public)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        contractor: {
          select: { id: true, displayName: true, organization: true }
        },
        transactions: {
          orderBy: { releaseDate: 'desc' }
        },
        proofs: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ success: false, error: { message: 'Project not found' } });
    }

    res.json({ success: true, data: project });
  } catch (error) {
    console.error('Fetch project detail error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch project details' } });
  }
});

// Get explainable risk analysis (Public)
router.get('/:id/risk', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const project = await prisma.project.findUnique({ where: { id }, select: { id: true } });
    if (!project) {
      return sendError(res, 404, 'Project not found', 'PROJECT_NOT_FOUND');
    }

    const analysis = await aiService.analyzeProject(id);
    return res.json({ success: true, data: analysis });
  } catch (error) {
    console.error('Risk analysis fetch failed:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to compute risk analysis', code: 'RISK_ANALYSIS_FAILED' },
    });
  }
});

// Create new project (Government only)
router.post('/', requireAuth, requireRole(['government']), async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, totalBudget, location, startDate, endDate, contractorId } = req.body;
    const fieldErrors: Record<string, string> = {};
    const parsedBudget = Number(totalBudget);
    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    if (!name || !String(name).trim()) fieldErrors.name = 'Project name is required';
    if (String(name || '').length > 200) fieldErrors.name = 'Project name must be 200 characters or fewer';
    if (!Number.isFinite(parsedBudget) || parsedBudget <= 0) fieldErrors.totalBudget = 'Total budget must be a positive number';
    if (!location || !String(location).trim()) fieldErrors.location = 'Location is required';
    if (String(location || '').length > 300) fieldErrors.location = 'Location must be 300 characters or fewer';
    if (!contractorId) fieldErrors.contractorId = 'Contractor is required';
    if (!startDate || Number.isNaN(parsedStartDate.getTime())) fieldErrors.startDate = 'Valid start date is required';
    if (!endDate || Number.isNaN(parsedEndDate.getTime())) fieldErrors.endDate = 'Valid end date is required';
    if (!fieldErrors.startDate && !fieldErrors.endDate && parsedEndDate <= parsedStartDate) {
      fieldErrors.endDate = 'End date must be after start date';
    }

    if (Object.keys(fieldErrors).length > 0) {
      return sendError(res, 400, 'Validation failed for project creation', 'PROJECT_VALIDATION_FAILED', fieldErrors);
    }

    const contractor = await prisma.user.findUnique({ where: { id: contractorId } });
    if (!contractor || contractor.role !== 'contractor') {
      return sendError(res, 400, 'Invalid contractor selected', 'INVALID_CONTRACTOR', {
        contractorId: 'Selected contractor is not valid',
      });
    }

    const duplicate = await prisma.project.findFirst({
      where: { name: String(name).trim() },
      select: { id: true, projectId: true },
    });
    if (duplicate) {
      return sendError(res, 409, 'A project with the same name already exists', 'DUPLICATE_PROJECT_NAME', {
        name: 'Project name already exists',
      });
    }

    // Record project creation on-chain for immutable audit trail.
    let onChainProjectId = 0;
    try {
      const chain = await blockchainService.createProjectOnChain(String(name).trim(), Math.round(parsedBudget));
      onChainProjectId = chain.onChainProjectId;
    } catch (error) {
      return sendError(
        res,
        503,
        error instanceof Error ? error.message : 'Project creation failed on blockchain. Please retry.',
        'PROJECT_BLOCKCHAIN_RECORD_FAILED'
      );
    }

    const projectId = await generateUniqueProjectId();

    const project = await prisma.project.create({
      data: {
        projectId,
        name: String(name).trim(),
        description,
        totalBudget: Math.round(parsedBudget),
        location: String(location).trim(),
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        contractorId,
        blockchainProjectId: onChainProjectId || null,
      }
    });

    res.status(201).json({ success: true, data: project });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to create project',
        code: 'PROJECT_CREATE_FAILED',
      },
    });
  }
});

// Upload a proof (Contractor only)
router.post('/:id/proofs', requireAuth, requireRole(['contractor']), upload.single('proofs'), async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { description } = req.body;
    const file = req.file;
    const descString = Array.isArray(description) ? description[0] : description as string;

    if (!file || !descString) {
      return sendError(res, 400, 'File and description are required', 'PROOF_VALIDATION_FAILED', {
        ...(file ? {} : { file: 'At least one file is required' }),
        ...(descString ? {} : { description: 'Description is required' }),
      });
    }

    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return sendError(res, 400, 'Unsupported file type', 'PROOF_UNSUPPORTED_FILE_TYPE', {
        file: 'Only JPG, PNG, PDF, DOCX are allowed',
      });
    }

    const integrity = validateProofIntegrity(file);
    if (!integrity.ok) {
      return sendError(res, 400, integrity.reason || 'Invalid proof file content', 'PROOF_INVALID_CONTENT', {
        file: integrity.reason || 'Proof file is invalid or corrupted',
      });
    }

    if (String(descString).trim().length > 500) {
      return sendError(res, 400, 'Description is too long', 'PROOF_DESCRIPTION_TOO_LONG', {
        description: 'Description must be 500 characters or fewer',
      });
    }

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      return sendError(res, 404, 'Project not found', 'PROJECT_NOT_FOUND');
    }

    // Check if the contractor owns this project
    if (project.contractorId !== req.user!.userId) {
      return sendError(res, 403, 'You are not assigned to this project', 'PROJECT_ACCESS_DENIED');
    }

    const onChainProjectId = getOnChainProjectId({
      blockchainProjectId: project.blockchainProjectId,
      projectId: project.projectId,
    });
    if (!onChainProjectId) {
      return sendError(res, 400, 'Project is not linked to blockchain ID', 'PROJECT_ONCHAIN_ID_MISSING');
    }

    // 1. Upload to IPFS
    const ipfsHash = await ipfsService.uploadToIPFS(file.buffer, file.originalname);

    // 2. Record CID on blockchain for tamper-proof proof audit trail
    let proofBlockchainTxHash = '';
    try {
      proofBlockchainTxHash = await blockchainService.recordProofHash(onChainProjectId, ipfsHash);
    } catch (error) {
      return sendError(
        res,
        503,
        error instanceof Error
          ? error.message
          : 'Proof stored on IPFS but blockchain recording failed. Please retry.',
        'PROOF_BLOCKCHAIN_RECORD_FAILED'
      );
    }

    const existingProof = await prisma.proof.findUnique({ where: { ipfsHash } });
    if (existingProof) {
      return res.status(200).json({
        success: true,
        data: {
          ...existingProof,
          blockchainTxHash: proofBlockchainTxHash,
        },
        message: 'Proof already exists for this CID',
      });
    }

    // 3. Save proof record to DB
    const proof = await prisma.proof.create({
      data: {
        projectId: id,
        fileName: file.originalname,
        fileType: file.mimetype,
        ipfsHash,
        description: descString
      }
    });

    // 4. Trigger Async AI Analysis (do not await)
    aiService.analyzeProofAsync(proof.id, id, String(descString)).catch(console.error);

    res.status(201).json({
      success: true,
      data: {
        ...proof,
        blockchainTxHash: proofBlockchainTxHash,
      },
    });
  } catch (error) {
    console.error('Upload proof error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to upload proof to decentralized storage',
        code: 'PROOF_UPLOAD_FAILED',
      },
    });
  }
});

// Release funds (Government only)
router.post('/:id/release-funds', requireAuth, requireRole(['government']), async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { amount, purpose } = req.body;
    const amountPaise = Number(amount);

    const fieldErrors: Record<string, string> = {};
    if (!Number.isFinite(amountPaise) || amountPaise <= 0) {
      fieldErrors.amount = 'Amount must be a positive number';
    }
    if (!purpose || !String(purpose).trim()) {
      fieldErrors.purpose = 'Purpose is required';
    } else if (String(purpose).trim().length > 500) {
      fieldErrors.purpose = 'Purpose must be 500 characters or fewer';
    }

    if (Object.keys(fieldErrors).length > 0) {
      return sendError(res, 400, 'Validation failed for fund release', 'FUND_RELEASE_VALIDATION_FAILED', fieldErrors);
    }

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      return sendError(res, 404, 'Project not found', 'PROJECT_NOT_FOUND');
    }

    if (project.fundsReleased + amountPaise > project.totalBudget) {
      return sendError(
        res,
        400,
        'Release amount exceeds remaining budget',
        'INSUFFICIENT_REMAINING_BUDGET',
        { amount: `Remaining budget is ${project.totalBudget - project.fundsReleased} paise` }
      );
    }

    const onChainProjectId = getOnChainProjectId({
      blockchainProjectId: project.blockchainProjectId,
      projectId: project.projectId,
    });
    if (!onChainProjectId) {
      return sendError(res, 400, 'Project is not linked to blockchain ID', 'PROJECT_ONCHAIN_ID_MISSING');
    }

    // 1. Execute blockchain transaction
    const txHash = await blockchainService.executeFundRelease(onChainProjectId, amountPaise);

    // 2. Update DB transaction log and project totals
    const [transaction, updatedProject] = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          projectId: id,
          amount: Math.round(amountPaise),
          purpose: String(purpose).trim(),
          releaseDate: new Date(),
          blockchainTxHash: txHash,
          status: 'confirmed'
        }
      }),
      prisma.project.update({
        where: { id },
        data: {
          fundsReleased: { increment: amountPaise }
        }
      })
    ]);

    // Trigger AI risk refresh in background after a new fund release.
    aiService.analyzeProject(id).catch(console.error);

    res.status(200).json({ 
      success: true, 
      data: { 
        transaction, 
        project: updatedProject 
      } 
    });
  } catch (error) {
    console.error('Release funds error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to release funds on blockchain',
        code: 'FUND_RELEASE_FAILED',
      },
    });
  }
});

// Manual AI analysis trigger (Government only)
router.post('/:id/analyze', requireAuth, requireRole(['government']), async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const project = await prisma.project.findUnique({ where: { id }, select: { id: true } });
    if (!project) {
      return sendError(res, 404, 'Project not found', 'PROJECT_NOT_FOUND');
    }

    const analysis = await aiService.analyzeProject(id);
    return res.json({ success: true, data: analysis });
  } catch (error) {
    console.error('Manual analysis trigger failed:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to analyze project', code: 'ANALYSIS_TRIGGER_FAILED' },
    });
  }
});

export default router;
