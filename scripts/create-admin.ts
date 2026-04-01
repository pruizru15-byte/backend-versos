import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function createAdmin() {
  const hashedPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@piero-versos.com" },
    update: { password: hashedPassword, role: "admin" },
    create: {
      email: "admin@piero-versos.com",
      name: "Po Admin",
      password: hashedPassword,
      role: "admin",
    },
  });
  console.log("Admin created:", admin.email);
}

createAdmin()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
