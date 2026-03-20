import { Router, Request, Response } from 'express';
import { prisma } from '../server';
import { authService } from '../services/authService';
import { requireAuth, AuthRequest } from '../middlewares/authMiddleware';

const router = Router();

// Mock Login: In a real app we would compare password hashes.
// Here we just find the user by email since it's a V1 MVP.
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: { message: 'Email is required' } });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const demoAliases: Record<string, string> = {
      'gov@demo': 'gov@demo.com',
      'build@demo': 'build@demo.com',
      'citizen@demo': 'citizen@demo.com',
      'gov@gmail.com': 'gov@demo.com',
      'buil@gmail.com': 'build@demo.com',
      'build@gmail.com': 'build@demo.com',
    };

    const loginEmail = demoAliases[normalizedEmail] || normalizedEmail;

    // In a real implementation we would verify the password:
    // if (password !== 'demo123') ...

    const user = await prisma.user.findUnique({
      where: { email: loginEmail }
    });

    if (!user) {
      return res.status(401).json({ success: false, error: { message: 'Invalid credentials' } });
    }

    const token = authService.generateToken(user);

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
          organization: user.organization
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: { message: 'Internal server error during login' } });
  }
});

// Get current user profile
router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ success: false, error: { message: 'User not found' } });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        organization: user.organization
      }
    });

  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ success: false, error: { message: 'Internal server error while fetching profile' } });
  }
});

export default router;
