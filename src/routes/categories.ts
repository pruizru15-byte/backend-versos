import { Router } from "express";
import prisma from "../lib/prisma.js";
import { authenticate, isAdmin } from "../middleware/auth.js";

const router = Router();

// List Categories
router.get("/", async (req: any, res: any) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: "Error fetching categories" });
  }
});

// Create Category (Admin Only)
router.post("/", authenticate, isAdmin, async (req: any, res: any) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });
  try {
    const category = await (prisma.category as any).create({
      data: { name, poemCount: 0 }
    });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: "Error creating category" });
  }
});

// Update Category (Admin Only)
router.put("/:id", authenticate, isAdmin, async (req: any, res: any) => {
  const { name } = req.body;
  try {
    const category = await (prisma.category as any).update({
      where: { id: req.params.id as string },
      data: { name }
    });
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: "Error updating category" });
  }
});

// Delete Category (Admin Only)
router.delete("/:id", authenticate, isAdmin, async (req: any, res: any) => {
  try {
    await (prisma.category as any).delete({
      where: { id: req.params.id as string }
    });
    res.json({ message: "Category deleted" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting category" });
  }
});

export default router;
