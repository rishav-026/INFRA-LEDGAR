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

const logAudit = async (params: {
  actorId?: string;
  projectId?: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: unknown;
}) => {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: params.actorId,
        projectId: params.projectId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      },
    });
  } catch (error) {
    console.warn('Audit log write failed:', error);
  }
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

    await logAudit({
      actorId: req.user!.userId,
      projectId: id,
      action: 'proof_uploaded',
      entityType: 'proof',
      entityId: proof.id,
      metadata: { ipfsHash, blockchainTxHash: proofBlockchainTxHash },
    });

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
    const { amount, purpose, milestoneId } = req.body as { amount: number; purpose: string; milestoneId?: string };
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

    const milestones = await prisma.milestone.findMany({
      where: { projectId: id },
      select: { id: true },
    });

    if (milestones.length > 0 && !milestoneId) {
      return sendError(
        res,
        400,
        'Milestone is required for fund release once escrow milestones exist',
        'MILESTONE_REQUIRED_FOR_RELEASE',
        { milestoneId: 'Select a milestone before creating a release request' }
      );
    }

    let resolvedMilestoneId: string | null = null;
    if (milestoneId) {
      const milestone = await prisma.milestone.findUnique({ where: { id: String(milestoneId) } });
      if (!milestone || milestone.projectId !== id) {
        return sendError(res, 404, 'Milestone not found for this project', 'MILESTONE_NOT_FOUND');
      }

      const proofCount = await prisma.proof.count({ where: { projectId: id } });
      const completion = project.completionPercentage;
      if (completion < milestone.requiredCompletionPercentage || proofCount < milestone.requiredProofCount) {
        return sendError(
          res,
          400,
          'Milestone evidence requirements are not met yet',
          'MILESTONE_EVIDENCE_NOT_MET',
          {
            completionPercentage: `Requires >= ${milestone.requiredCompletionPercentage}%`,
            proofCount: `Requires >= ${milestone.requiredProofCount} proof(s)`,
          }
        );
      }

      const executedForMilestone = await prisma.fundReleaseRequest.aggregate({
        where: { milestoneId: milestone.id, status: 'executed' },
        _sum: { amount: true },
      });
      const alreadyReleased = executedForMilestone._sum.amount || 0;
      const remainingMilestoneEscrow = milestone.escrowAmount - alreadyReleased;
      if (amountPaise > remainingMilestoneEscrow) {
        return sendError(
          res,
          400,
          'Amount exceeds milestone escrow remaining',
          'MILESTONE_ESCROW_EXCEEDED',
          { amount: `Milestone remaining escrow is ${remainingMilestoneEscrow} paise` }
        );
      }

      if (milestone.status === 'pending') {
        await prisma.milestone.update({ where: { id: milestone.id }, data: { status: 'approved' } });
      }

      resolvedMilestoneId = milestone.id;
    }

    const requestRow = await prisma.fundReleaseRequest.create({
      data: {
        projectId: id,
        milestoneId: resolvedMilestoneId,
        amount: Math.round(amountPaise),
        purpose: String(purpose).trim(),
        makerId: req.user!.userId,
        status: 'pending_checker',
      },
      include: {
        maker: { select: { id: true, email: true, displayName: true } },
        milestone: { select: { id: true, name: true, status: true } },
      },
    });

    await logAudit({
      actorId: req.user!.userId,
      projectId: id,
      action: 'release_request_created',
      entityType: 'fund_release_request',
      entityId: requestRow.id,
      metadata: { amountPaise, milestoneId: resolvedMilestoneId },
    });

    res.status(200).json({ 
      success: true, 
      data: { 
        request: requestRow,
        project,
      },
      message: 'Release request submitted for checker approval',
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

// Milestone creation (Government only)
router.post('/:id/milestones', requireAuth, requireRole(['government']), async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const {
      name,
      escrowAmount,
      requiredProofCount,
      requiredCompletionPercentage,
    } = req.body as {
      name?: string;
      escrowAmount?: number;
      requiredProofCount?: number;
      requiredCompletionPercentage?: number;
    };

    const project = await prisma.project.findUnique({ where: { id }, select: { id: true } });
    if (!project) {
      return sendError(res, 404, 'Project not found', 'PROJECT_NOT_FOUND');
    }

    const fieldErrors: Record<string, string> = {};
    const amount = Number(escrowAmount);
    const proofCount = Number(requiredProofCount ?? 0);
    const completion = Number(requiredCompletionPercentage ?? 0);
    if (!name || !String(name).trim()) fieldErrors.name = 'Milestone name is required';
    if (!Number.isFinite(amount) || amount <= 0) fieldErrors.escrowAmount = 'Escrow amount must be positive';
    if (!Number.isFinite(proofCount) || proofCount < 0) fieldErrors.requiredProofCount = 'Required proof count must be zero or more';
    if (!Number.isFinite(completion) || completion < 0 || completion > 100) {
      fieldErrors.requiredCompletionPercentage = 'Required completion must be between 0 and 100';
    }

    if (Object.keys(fieldErrors).length > 0) {
      return sendError(res, 400, 'Validation failed for milestone', 'MILESTONE_VALIDATION_FAILED', fieldErrors);
    }

    const milestone = await prisma.milestone.create({
      data: {
        projectId: id,
        name: String(name).trim(),
        escrowAmount: Math.round(amount),
        requiredProofCount: Math.round(proofCount),
        requiredCompletionPercentage: Math.round(completion),
      },
    });

    await logAudit({
      actorId: req.user!.userId,
      projectId: id,
      action: 'milestone_created',
      entityType: 'milestone',
      entityId: milestone.id,
      metadata: { escrowAmount: milestone.escrowAmount },
    });

    return res.status(201).json({ success: true, data: milestone });
  } catch (error) {
    console.error('Create milestone error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to create milestone', code: 'MILESTONE_CREATE_FAILED' },
    });
  }
});

// Milestone listing (Public)
router.get('/:id/milestones', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const milestones = await prisma.milestone.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'asc' },
    });
    return res.json({ success: true, data: milestones });
  } catch (error) {
    console.error('List milestones error:', error);
    return res.status(500).json({ success: false, error: { message: 'Failed to fetch milestones' } });
  }
});

// Release request listing (Government only)
router.get('/:id/release-requests', requireAuth, requireRole(['government']), async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const requests = await prisma.fundReleaseRequest.findMany({
      where: { projectId: id },
      include: {
        maker: { select: { id: true, displayName: true, email: true } },
        checker: { select: { id: true, displayName: true, email: true } },
        approver: { select: { id: true, displayName: true, email: true } },
        milestone: { select: { id: true, name: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ success: true, data: requests });
  } catch (error) {
    console.error('List release requests error:', error);
    return res.status(500).json({ success: false, error: { message: 'Failed to fetch release requests' } });
  }
});

// Review release request (Government checker/approver)
router.patch('/:id/release-requests/:requestId/review', requireAuth, requireRole(['government']), async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const requestId = req.params.requestId as string;
    const { action, reason } = req.body as { action?: 'approve' | 'reject'; reason?: string };

    if (!action || !['approve', 'reject'].includes(action)) {
      return sendError(res, 400, 'Invalid review action', 'REVIEW_ACTION_INVALID', {
        action: 'Action must be approve or reject',
      });
    }

    const requestRow = await prisma.fundReleaseRequest.findUnique({
      where: { id: requestId },
      include: { project: true, milestone: true },
    });

    if (!requestRow || requestRow.projectId !== id) {
      return sendError(res, 404, 'Release request not found', 'RELEASE_REQUEST_NOT_FOUND');
    }

    if (requestRow.status === 'executed' || requestRow.status === 'rejected') {
      return sendError(res, 400, 'Release request already closed', 'RELEASE_REQUEST_ALREADY_CLOSED');
    }

    const actorId = req.user!.userId;

    if (action === 'reject') {
      const rejected = await prisma.fundReleaseRequest.update({
        where: { id: requestRow.id },
        data: {
          status: 'rejected',
          rejectionReason: reason ? String(reason).trim() : 'Rejected by reviewer',
        },
      });

      await logAudit({
        actorId,
        projectId: id,
        action: 'release_request_rejected',
        entityType: 'fund_release_request',
        entityId: requestRow.id,
        metadata: { reason: rejected.rejectionReason },
      });

      return res.json({ success: true, data: rejected });
    }

    const govUsers = await prisma.user.count({ where: { role: 'government' } });
    const strictSplit = govUsers > 1;

    if (requestRow.status === 'pending_checker') {
      if (strictSplit && requestRow.makerId === actorId) {
        return sendError(res, 400, 'Maker cannot act as checker when multiple government users exist', 'CHECKER_ROLE_CONFLICT');
      }

      const checked = await prisma.fundReleaseRequest.update({
        where: { id: requestRow.id },
        data: {
          status: 'pending_approver',
          checkerId: actorId,
        },
      });

      await logAudit({
        actorId,
        projectId: id,
        action: 'release_request_checked',
        entityType: 'fund_release_request',
        entityId: requestRow.id,
      });

      return res.json({ success: true, data: checked, message: 'Request moved to approver stage' });
    }

    if (requestRow.status === 'pending_approver') {
      if (strictSplit && (requestRow.makerId === actorId || requestRow.checkerId === actorId)) {
        return sendError(res, 400, 'Approver must be a different user from maker/checker', 'APPROVER_ROLE_CONFLICT');
      }

      if (requestRow.project.fundsReleased + requestRow.amount > requestRow.project.totalBudget) {
        return sendError(
          res,
          400,
          'Release amount exceeds remaining budget',
          'INSUFFICIENT_REMAINING_BUDGET',
          { amount: `Remaining budget is ${requestRow.project.totalBudget - requestRow.project.fundsReleased} paise` }
        );
      }

      const onChainProjectId = getOnChainProjectId({
        blockchainProjectId: requestRow.project.blockchainProjectId,
        projectId: requestRow.project.projectId,
      });
      if (!onChainProjectId) {
        return sendError(res, 400, 'Project is not linked to blockchain ID', 'PROJECT_ONCHAIN_ID_MISSING');
      }

      const txHash = await blockchainService.executeFundRelease(onChainProjectId, requestRow.amount);

      const [transaction, updatedProject, executedRequest] = await prisma.$transaction([
        prisma.transaction.create({
          data: {
            projectId: requestRow.projectId,
            amount: requestRow.amount,
            purpose: requestRow.purpose,
            releaseDate: new Date(),
            blockchainTxHash: txHash,
            status: 'confirmed',
          },
        }),
        prisma.project.update({
          where: { id: requestRow.projectId },
          data: { fundsReleased: { increment: requestRow.amount } },
        }),
        prisma.fundReleaseRequest.update({
          where: { id: requestRow.id },
          data: {
            status: 'executed',
            approverId: actorId,
            blockchainTxHash: txHash,
          },
        }),
      ]);

      await prisma.fundReleaseRequest.update({
        where: { id: executedRequest.id },
        data: { transactionId: transaction.id },
      });

      if (requestRow.milestoneId) {
        const sums = await prisma.fundReleaseRequest.aggregate({
          where: { milestoneId: requestRow.milestoneId, status: 'executed' },
          _sum: { amount: true },
        });
        const milestone = await prisma.milestone.findUnique({ where: { id: requestRow.milestoneId } });
        if (milestone && (sums._sum.amount || 0) >= milestone.escrowAmount) {
          await prisma.milestone.update({ where: { id: milestone.id }, data: { status: 'completed' } });
        }
      }

      await logAudit({
        actorId,
        projectId: id,
        action: 'release_request_executed',
        entityType: 'fund_release_request',
        entityId: requestRow.id,
        metadata: { txHash, amount: requestRow.amount },
      });

      aiService.analyzeProject(requestRow.projectId).catch(console.error);

      return res.json({
        success: true,
        data: {
          request: { ...executedRequest, transactionId: transaction.id },
          transaction,
          project: updatedProject,
        },
      });
    }

    return sendError(res, 400, 'Unsupported release request state', 'RELEASE_REQUEST_STATE_INVALID');
  } catch (error) {
    console.error('Review release request error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to review release request', code: 'RELEASE_REQUEST_REVIEW_FAILED' },
    });
  }
});

// Audit logs for project (Government only)
router.get('/:id/audit-logs', requireAuth, requireRole(['government']), async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const logs = await prisma.auditLog.findMany({
      where: { projectId: id },
      include: {
        actor: {
          select: { id: true, email: true, displayName: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return res.json({ success: true, data: logs });
  } catch (error) {
    console.error('Fetch audit logs error:', error);
    return res.status(500).json({ success: false, error: { message: 'Failed to fetch audit logs' } });
  }
});

// Update completion percentage (Government only)
router.patch('/:id/completion', requireAuth, requireRole(['government']), async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { completionPercentage } = req.body as { completionPercentage?: number };

    const parsedCompletion = Number(completionPercentage);
    const fieldErrors: Record<string, string> = {};
    if (!Number.isFinite(parsedCompletion)) {
      fieldErrors.completionPercentage = 'Completion percentage must be a valid number';
    } else if (parsedCompletion < 0 || parsedCompletion > 100) {
      fieldErrors.completionPercentage = 'Completion percentage must be between 0 and 100';
    }

    if (Object.keys(fieldErrors).length > 0) {
      return sendError(
        res,
        400,
        'Validation failed for completion update',
        'COMPLETION_UPDATE_VALIDATION_FAILED',
        fieldErrors
      );
    }

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      return sendError(res, 404, 'Project not found', 'PROJECT_NOT_FOUND');
    }

    let status = project.status;
    if (parsedCompletion === 100 && project.status === 'active') {
      status = 'completed';
    } else if (parsedCompletion < 100 && project.status === 'completed') {
      status = 'active';
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        completionPercentage: Math.round(parsedCompletion),
        status,
      },
    });

    // Refresh risk model after progress change.
    aiService.analyzeProject(id).catch(console.error);

    await logAudit({
      actorId: req.user!.userId,
      projectId: id,
      action: 'completion_updated',
      entityType: 'project',
      entityId: id,
      metadata: { completionPercentage: updatedProject.completionPercentage, status: updatedProject.status },
    });

    return res.status(200).json({ success: true, data: updatedProject });
  } catch (error) {
    console.error('Update completion error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to update project completion',
        code: 'COMPLETION_UPDATE_FAILED',
      },
    });
  }
});

// Delete project (Government only)
router.delete('/:id', requireAuth, requireRole(['government']), async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    const project = await prisma.project.findUnique({
      where: { id },
      select: {
        id: true,
        projectId: true,
        name: true,
      },
    });

    if (!project) {
      return sendError(res, 404, 'Project not found', 'PROJECT_NOT_FOUND');
    }

    await logAudit({
      actorId: req.user!.userId,
      projectId: id,
      action: 'project_deleted',
      entityType: 'project',
      entityId: id,
      metadata: { projectId: project.projectId, name: project.name },
    });

    await prisma.project.delete({ where: { id } });

    return res.status(200).json({
      success: true,
      data: {
        id: project.id,
        projectId: project.projectId,
        name: project.name,
        deleted: true,
      },
      message: 'Project deleted successfully',
    });
  } catch (error) {
    console.error('Delete project error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to delete project',
        code: 'PROJECT_DELETE_FAILED',
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
    await logAudit({
      actorId: req.user!.userId,
      projectId: id,
      action: 'risk_review_triggered',
      entityType: 'analysis',
      entityId: id,
      metadata: { provider: analysis.analysis.provider, riskScore: analysis.analysis.riskScore },
    });
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
