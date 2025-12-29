import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs' // ou 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const password = '123'
  const salt = await bcrypt.genSalt(10)
  const hashedPassword = await bcrypt.hash(password, salt)

  console.log('Gerando novo hash para a senha...');

  // O upsert garante que se o usuário existir, ele ATUALIZE a senha
  const user = await prisma.user.upsert({
    where: { email: 'admin@zen.com' },
    update: {
      password: hashedPassword, // Força a atualização para o HASH
    },
    create: {
      email: 'admin@zen.com',
      name: 'Admin Zen',
      password: hashedPassword,
    },
  })

  console.log('✅ Usuário atualizado com sucesso no banco!');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect())