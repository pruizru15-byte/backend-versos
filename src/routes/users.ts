import { Router } from "express";
import prisma from "../lib/prisma.js";
import { authenticate, isAdmin } from "../middleware/auth.js";

const router = Router();

// Admin: List all users
router.get("/admin/all", authenticate, isAdmin, async (req: any, res: any) => {
  try {
    const users = await (prisma.user as any).findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        blocked: true,
        createdAt: true,
        _count: {
          select: { poems: true, likes: true }
        }
      }
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Error fetching users" });
  }
});

// Admin: Update user (Block/Unblock/Role)
router.put("/admin/:id", authenticate, isAdmin, async (req: any, res: any) => {
  const { blocked, role } = req.body;
  try {
    const user = await (prisma.user as any).update({
      where: { id: req.params.id },
      data: { blocked, role }
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Error updating user" });
  }
});

router.get("/me", authenticate, async (req: any, res: any) => {
  try {
    const user = await (prisma.user as any).findUnique({
      where: { id: req.user!.id },
      include: {
        saved: { 
          include: { 
            poem: { include: { _count: { select: { likes: true } } } } 
          }
        },
        likes: true
      }
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Error fetching profile" });
  }
});

router.get("/:id", async (req: any, res: any) => {
  const id = req.params.id as string;
  try {
    const user = await (prisma.user as any).findUnique({
      where: { id },
      include: {
        poems: { include: { _count: { select: { likes: true } } } },
        _count: { select: { likes: true, saved: true } }
      }
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({
      id: user.id,
      name: user.name,
      avatarUrl: user.avatarUrl,
      role: user.role,
      poems: user.poems,
      stats: user._count
    });
  } catch (err) {
    res.status(500).json({ error: "Error fetching user profile" });
  }
});

export default router;
