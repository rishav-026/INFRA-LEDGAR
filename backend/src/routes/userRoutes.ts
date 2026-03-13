import { Router, Request, Response } from 'express';
import { prisma } from '../server';
import { requireAuth, requireRole, AuthRequest } from '../middlewares/authMiddleware';

const router = Router();

// Get all users (Government only)
router.get('/', requireAuth, requireRole(['government']), async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firebaseUid: true,
        email: true,
        displayName: true,
        role: true,
        organization: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Fetch users error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch users' } });
  }
});

// Update user role (Government only)
router.put('/:id/role', requireAuth, requireRole(['government']), async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { role } = req.body;

    if (!['government', 'contractor', 'citizen'].includes(role)) {
      return res.status(400).json({ success: false, error: { message: 'Invalid role provided' } });
    }

    // Prevent changing own role for safety in demo
    if (id === req.user!.userId) {
      return res.status(400).json({ success: false, error: { message: 'Cannot modify your own role' } });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, email: true, role: true }
    });

    res.json({ success: true, data: updatedUser });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to update user role' } });
  }
});

export default router;
