import { Router } from "express";
import { sendEmail } from "../lib/mailer.js";

const router = Router();

router.post("/", async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: "Todos los campos son obligatorios" });
  }

  try {
    await sendEmail(
      "rpieroalexandro@gmail.com", // TARGET EMAIL
      `[Contacto Versos] ${subject}`,
      message,
      email,
      name
    );
    res.json({ success: true, message: "Mensaje enviado con éxito" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error enviando el mensaje imperial" });
  }
});

export default router;
