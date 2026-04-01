import { Router } from "express";
import prisma from "../lib/prisma.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const db: any = prisma;
    const [
      userCount, 
      poemCount, 
      commentCount,
      likeCount,
      saveCount,
      totals,
    ] = await Promise.all([
      db.user.count(),
      db.poem.count(),
      db.comment.count(),
      db.like.count(),
      db.savedPoem.count(),
      db.poem.aggregate({
        _sum: {
          views: true,
          downloads: true,
          shares: true,
        }
      })
    ]);

    const topPoems = await db.poem.findMany({
      orderBy: { views: 'desc' },
      take: 5
    });

    const recentUsers = await db.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // Recent activity: Combine comments and likes
    const [latestComments, latestLikes] = await Promise.all([
      db.comment.findMany({
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: { poem: { select: { title: true } } }
      }),
      db.like.findMany({
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: { user: { select: { name: true } }, poem: { select: { title: true } } }
      })
    ]);

    const distribution = await db.category.findMany({
      select: { name: true, poemCount: true },
      orderBy: { poemCount: 'desc' },
      take: 6
    });

    res.json({
      users: userCount,
      poems: poemCount,
      comments: commentCount,
      likes: likeCount,
      saves: saveCount,
      totalViews: totals._sum.views || 0,
      totalDownloads: totals._sum.downloads || 0,
      totalShares: totals._sum.shares || 0,
      topPoems,
      recentUsers,
      distribution,
      activity: {
        comments: latestComments,
        likes: latestLikes
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching stats" });
  }
});

export default router;
