import { prisma } from '../server';

const ANALYSIS_INTERVAL_HOURS = Number(process.env.AI_CRON_INTERVAL_HOURS || 6);

let schedulerStarted = false;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const computeRisk = (input: {
  fundsReleasedPct: number;
  completionPct: number;
  proofCount: number;
  daysElapsed: number;
  releaseFrequency: number;
}) => {
  let score = 0.12;

  if (input.fundsReleasedPct >= 0.8 && input.completionPct <= 0.3) score += 0.45;
  if (input.fundsReleasedPct >= 0.5 && input.proofCount === 0) score += 0.28;
  if (input.releaseFrequency >= 1.5 && input.daysElapsed <= 14) score += 0.18;
  if (input.proofCount >= 3) score -= 0.08;
  if (input.completionPct >= input.fundsReleasedPct) score -= 0.12;

  const riskScore = Number(clamp(score, 0.02, 0.98).toFixed(4));
  const riskLevel = riskScore > 0.6 ? 'high' : riskScore >= 0.3 ? 'medium' : 'normal';
  return { riskScore, riskLevel };
};

export const aiService = {
  analyzeProject: async (projectId: string) => {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        transactions: { select: { id: true } },
        proofs: { select: { id: true } },
      },
    });

    if (!project) {
      throw new Error('Project not found for AI analysis');
    }

    const fundsReleasedPct = project.totalBudget > 0 ? project.fundsReleased / project.totalBudget : 0;
    const completionPct = clamp(project.completionPercentage / 100, 0, 1);
    const proofCount = project.proofs.length;
    const daysElapsed = Math.max(
      1,
      Math.floor((Date.now() - new Date(project.startDate).getTime()) / 86400000)
    );
    const releaseFrequency = project.transactions.length / Math.max(daysElapsed / 7, 1);

    const { riskScore, riskLevel } = computeRisk({
      fundsReleasedPct,
      completionPct,
      proofCount,
      daysElapsed,
      releaseFrequency,
    });

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: { riskScore, riskLevel },
      include: {
        transactions: { orderBy: { releaseDate: 'desc' } },
        proofs: { orderBy: { createdAt: 'desc' } },
        contractor: {
          select: { id: true, displayName: true, organization: true },
        },
      },
    });

    return {
      project: updated,
      analysis: {
        riskScore,
        riskLevel,
        features: {
          fundsReleasedPct: Number((fundsReleasedPct * 100).toFixed(2)),
          completionPct: Number((completionPct * 100).toFixed(2)),
          proofCount,
          daysElapsed,
          releaseFrequency: Number(releaseFrequency.toFixed(2)),
        },
      },
    };
  },

  startScheduler: () => {
    if (schedulerStarted) return;
    schedulerStarted = true;

    const intervalMs = Math.max(1, ANALYSIS_INTERVAL_HOURS) * 60 * 60 * 1000;

    const runBatch = async () => {
      try {
        const projects = await prisma.project.findMany({ select: { id: true } });
        for (const project of projects) {
          try {
            await aiService.analyzeProject(project.id);
          } catch (err) {
            console.error(`AI batch analysis failed for project ${project.id}:`, err);
          }
        }
      } catch (error) {
        console.error('AI scheduler batch run failed:', error);
      }
    };

    setInterval(() => {
      void runBatch();
    }, intervalMs);

    console.log(`🧠 AI scheduler started (interval: ${ANALYSIS_INTERVAL_HOURS}h)`);
  },

  /**
   * Asynchronously analyzes a proof and updates the project's risk score.
   * In a production system, this would be pushed to a queue (like BullMQ).
   */
  analyzeProofAsync: async (proofId: string, projectId: string, _description: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));

      await prisma.proof.update({
        where: { id: proofId },
        data: {
          aiAnalysisCompleted: true,
          flaggedAnomalies: JSON.stringify(['Heuristic analysis executed']),
        },
      });

      const analysis = await aiService.analyzeProject(projectId);
      console.log(`✅ [AI Heuristic] Analyzed proof ${proofId} for project ${projectId}. Score: ${analysis.analysis.riskScore}`);

    } catch (error) {
      console.error(`❌ [AI Engine] Failed to analyze proof ${proofId}:`, error);
      // We don't throw here to avoid crashing the node process, 
      // since this runs asynchronously outside the HTTP request.
    }
  }
};
