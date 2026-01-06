import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('123456', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@zen.com' },
    update: {},
    create: {
      email: 'admin@zen.com',
      name: 'Admin Zen',
      password: hashedPassword,
      systemPrompt: "Você é um organizador de biblioteca espiritual. Padrão: [CATEGORIA] Sub - Assunto - Autor.mp4",
      chatPrompt: "Você é o ChatZen, um mentor acolhedor baseado na filosofia espírita."
    },
  })

  console.log({ admin })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })