import { Router, Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { authenticate, AuthRequest, isAdmin } from "../middleware/auth.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();

// Ensure uploads directories exist
const uploadDir = "uploads";
const audioDir = path.join(uploadDir, "audio");
const imageDir = path.join(uploadDir, "images");

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });
if (!fs.existsSync(imageDir)) fs.mkdirSync(imageDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "audio") cb(null, audioDir);
    else if (file.fieldname === "image") cb(null, imageDir);
    else cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});

const upload = multer({ storage });

// List poems
router.get("/", async (req: Request, res: Response) => {
  const { category, sort } = req.query;
  try {
    let orderBy: any = { createdAt: 'desc' };
    
    if (sort === 'popular') {
      orderBy = { likes: { _count: 'desc' } };
    } else if (sort === 'downloaded') {
      orderBy = { downloads: 'desc' };
    } else if (sort === 'recent') {
      orderBy = { createdAt: 'desc' };
    }

    const poems = await prisma.poem.findMany({
      where: category ? { category: String(category) } : {},
      orderBy: orderBy,
      include: { 
        comments: true,
        _count: {
          select: { likes: true, savedBy: true }
        }
      }
    });
    res.json(poems);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching poems" });
  }
});

// Single poem
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const poem = await prisma.poem.findUnique({
      where: { id: req.params.id as string },
      include: { 
        comments: { orderBy: { createdAt: 'desc' } },
        _count: {
          select: { likes: true, savedBy: true }
        }
      }
    });
    if (!poem) return res.status(404).json({ error: "Poem not found" });
    res.json(poem);
  } catch (error) {
    res.status(500).json({ error: "Error fetching poem" });
  }
});

// Create poem (Admin only)
router.post("/", authenticate, isAdmin, upload.fields([{ name: 'audio', maxCount: 1 }, { name: 'image', maxCount: 1 }]), async (req: any, res: Response) => {
  const { title, content, author, category, featured } = req.body;
  const files = req.files as any;
  
  const audioUrl = files?.audio ? `/uploads/audio/${files.audio[0].filename}` : null;
  const imageUrl = files?.image ? `/uploads/images/${files.image[0].filename}` : null;

  try {
    const poem = await prisma.poem.create({
      data: {
        title: title || "Sin título",
        content: content || "",
        author: author || "Anónimo",
        category: category || "General",
        featured: featured === 'true',
        hasAudio: !!audioUrl,
        audioUrl,
        imageUrl,
      }
    });
    res.status(201).json(poem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error creating poem" });
  }
});

// Update poem (Admin only)
router.put("/:id", authenticate, isAdmin, upload.fields([{ name: 'audio', maxCount: 1 }, { name: 'image', maxCount: 1 }]), async (req: any, res: Response) => {
  const { title, content, author, category, featured } = req.body;
  const files = req.files as any;
  
  const updateData: any = {
    title,
    content,
    author,
    category,
    featured: featured === 'true',
  };

  if (files?.audio) {
    updateData.audioUrl = `/uploads/audio/${files.audio[0].filename}`;
    updateData.hasAudio = true;
  }
  if (files?.image) updateData.imageUrl = `/uploads/images/${files.image[0].filename}`;

  try {
    const poem = await prisma.poem.update({
      where: { id: req.params.id as string },
      data: updateData
    });
    res.json(poem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error updating poem" });
  }
});

// Delete poem (Admin only)
router.delete("/:id", authenticate, isAdmin, async (req: any, res: Response) => {
  try {
    await prisma.poem.delete({
      where: { id: req.params.id as string }
    });
    res.json({ message: "Poem deleted" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting poem" });
  }
});

// Like/Unlike Toggle
router.post("/:id/like", authenticate, async (req: AuthRequest, res: Response) => {
  const poemId = req.params.id as string;
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  try {
    const existing = await prisma.like.findUnique({
      where: { userId_poemId: { userId, poemId } }
    });

    if (existing) {
      await prisma.like.delete({
        where: { userId_poemId: { userId, poemId } }
      });
      res.json({ liked: false });
    } else {
      await prisma.like.create({
        data: { userId, poemId }
      });
      res.json({ liked: true });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error liking poem" });
  }
});

// Save/Unsave Toggle
router.post("/:id/save", authenticate, async (req: AuthRequest, res: Response) => {
  const poemId = req.params.id as string;
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  try {
    const existing = await prisma.savedPoem.findUnique({
      where: { userId_poemId: { userId, poemId } }
    });

    if (existing) {
      await prisma.savedPoem.delete({
        where: { userId_poemId: { userId, poemId } }
      });
      res.json({ saved: false });
    } else {
      await prisma.savedPoem.create({
        data: { userId, poemId }
      });
      res.json({ saved: true });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error saving poem" });
  }
});

// Add Comment
router.post("/:id/comment", authenticate, async (req: AuthRequest, res: Response) => {
  const poemId = req.params.id as string;
  const { text } = req.body;
  const userId = req.user?.id;
  const userName = req.user?.name || "Anónimo";
  
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  if (!text) return res.status(400).json({ error: "Comment text is required" });

  try {
    const comment = await prisma.comment.create({
      data: {
        poemId,
        userId,
        userName,
        text
      }
    });
    res.status(201).json(comment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error creating comment" });
  }
});

// Share Increment
router.post("/:id/share", async (req: Request, res: Response) => {
  try {
    const poem = await prisma.poem.update({
      where: { id: req.params.id as string },
      data: { shares: { increment: 1 } }
    });
    res.json({ shares: poem.shares });
  } catch (err) {
    res.status(500).json({ error: "Error sharing poem" });
  }
});

// View Increment
router.post("/:id/view", async (req: Request, res: Response) => {
  try {
    const poemId = req.params.id;
    const exists = await prisma.poem.findUnique({ where: { id: poemId } });
    if (!exists) return res.status(404).json({ error: "Poem not found" });

    const poem = await prisma.poem.update({
      where: { id: req.params.id as string },
      data: { views: { increment: 1 } }
    });
    res.json({ views: poem.views });
  } catch (err) {
    res.status(500).json({ error: "Error updating view" });
  }
});

export default router;
