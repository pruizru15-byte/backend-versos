import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const categories = [
  { name: "Amor", poemCount: 12 },
  { name: "Melancolía", poemCount: 8 },
  { name: "Naturaleza", poemCount: 6 },
  { name: "Existencial", poemCount: 10 },
  { name: "Esperanza", poemCount: 5 },
  { name: "Noche", poemCount: 7 },
];

const poems = [
  {
    title: "Donde habita el silencio",
    content: `Donde habita el olvido,
en los vastos jardines sin aurora;
donde yo solo sea
memoria de una piedra sepultada entre ortigas
sobre la cual el viento escapa a sus insomnios.

Donde mi nombre deje
al cuerpo que designa en brazos de los siglos,
donde el deseo no exista.

En esa gran región donde el amor, ángel terrible,
no esconda como acero
en mi pecho su ala,
sonriendo lleno de gracia aérea mientras crece el tormento.`,
    author: "Luis Cernuda",
    category: "Melancolía",
    views: 1847,
    downloads: 89,
    hasAudio: true,
    featured: true,
  },
  {
    title: "Rima XXI",
    content: `¿Qué es poesía?, dices mientras clavas
en mi pupila tu pupila azul.
¿Qué es poesía? ¿Y tú me lo preguntas?
Poesía... eres tú.`,
    author: "Gustavo Adolfo Bécquer",
    category: "Amor",
    views: 3201,
    downloads: 245,
    hasAudio: false,
    featured: true,
  },
  {
    title: "Caminante no hay camino",
    content: `Caminante, son tus huellas
el camino y nada más;
Caminante, no hay camino,
se hace camino al andar.

Al andar se hace el camino,
y al volver la vista atrás
se ve la senda que nunca
se ha de volver a pisar.

Caminante no hay camino
sino estelas en la mar.`,
    author: "Antonio Machado",
    category: "Existencial",
    views: 5430,
    downloads: 412,
    hasAudio: true,
    featured: true,
  },
  {
    title: "Poema 20",
    content: `Puedo escribir los versos más tristes esta noche.
Escribir, por ejemplo: "La noche está estrellada,
y tiritan, azules, los astros, a lo lejos."

El viento de la noche gira en el cielo y canta.

Puedo escribir los versos más tristes esta noche.
Yo la quise, y a veces ella también me quiso.

En las noches como esta la tuve entre mis brazos.
La besé tantas veces bajo el cielo infinito.`,
    author: "Pablo Neruda",
    category: "Amor",
    views: 7892,
    downloads: 534,
    hasAudio: true,
    featured: true,
  },
];

const users = [
  { name: "María García", email: "maria@email.com", role: "client", blocked: false, password: "user123" },
  { name: "Carlos Ruiz", email: "carlos@email.com", role: "client", blocked: false, password: "user123" },
  { name: "Ana Morales", email: "ana@email.com", role: "client", blocked: false, password: "user123" },
  { name: "Lucía Fernández", email: "lucia@email.com", role: "client", blocked: true, password: "user123" },
  { name: "Administrador", email: "admin@versos.com", role: "admin", blocked: false, password: "admin123" },
];

async function main() {
  console.log("Seeding database...");

  // Clear existing
  await prisma.comment.deleteMany();
  await prisma.poem.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  for (const cat of categories) {
    await prisma.category.create({ data: cat });
  }

  for (const userData of users) {
    const { password, ...rest } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.create({ 
      data: { 
        ...rest, 
        password: hashedPassword 
      } 
    });
  }

  for (const poem of poems) {
    await prisma.poem.create({
      data: poem
    });
  }

  console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
