import { Router, Request, Response } from 'express';
import { prisma } from '../server';

const router = Router();

const toSafeNumber = (value: bigint | number | null | undefined) => {
  if (typeof value === 'bigint') return Number(value);
  return value || 0;
};

// Get high-level analytics (Public)
router.get('/', async (req: Request, res: Response) => {
  try {
    const [
      totalProjects,
      activeProjects,
      totalBudgetAgg,
      totalFundsReleasedAgg,
      flaggedProjects,
      totalProofsUploaded
    ] = await Promise.all([
      prisma.project.count(),
      prisma.project.count({ where: { status: 'active' } }),
      prisma.project.aggregate({
        _sum: { totalBudget: true }
      }),
      prisma.project.aggregate({
        _sum: { fundsReleased: true }
      }),
      prisma.project.count({ where: { riskLevel: 'high' } }),
      prisma.proof.count()
    ]);

    // Construct mock recent activity (or pull from an activity log table, 
    // but for V1 we'll just return static or simplified aggregate)

    res.json({
      success: true,
      data: {
        totalProjects,
        activeProjects,
        totalBudget: toSafeNumber(totalBudgetAgg._sum.totalBudget),
        totalFundsReleased: toSafeNumber(totalFundsReleasedAgg._sum.fundsReleased),
        flaggedProjects,
        totalProofsUploaded
      }
    });
  } catch (error) {
    console.error('Fetch analytics error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch analytics' } });
  }
});

export default router;
