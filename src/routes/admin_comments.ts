import { Router, Response } from "express";
import prisma from "../lib/prisma.js";
import { authenticate, isAdmin, AuthRequest } from "../middleware/auth.js";

const router = Router();

// Get all comments for management
router.get("/", authenticate, isAdmin, async (req: any, res: Response) => {
  try {
    const comments = await prisma.comment.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        poem: {
          select: { title: true }
        }
      }
    });
    res.json(comments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching admin comments" });
  }
});

// Reply to a comment
router.patch("/:id/reply", authenticate, isAdmin, async (req: any, res: Response) => {
  const { id } = req.params;
  const { replyText } = req.body;
  try {
    const comment = await prisma.comment.update({
      where: { id: id as string },
      data: {
        adminReply: replyText,
        repliedAt: new Date()
      }
    });
    res.json(comment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error replying to comment" });
  }
});

// Delete a comment
router.delete("/:id", authenticate, isAdmin, async (req: any, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.comment.delete({
      where: { id: id as string }
    });
    res.json({ message: "Comment deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error deleting comment" });
  }
});

export default router;
