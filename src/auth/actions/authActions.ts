'use server'

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs"; // MUDANÇA: Usando bcryptjs para compatibilidade

export async function registerUserAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;

  console.log("Tentativa de registro:", { email, name }); // Log para debug

  if (!email || !password || !name) {
    return { error: "Todos os campos são obrigatórios." };
  }

  try {
    // Verifica se o usuário já existe
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return { error: "Este e-mail já está em uso." };
    }

    // Criptografa a senha com bcryptjs
    const hashedPassword = await bcrypt.hash(password, 10);

    // Cria o usuário
    await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        systemPrompt: "Você é um organizador de biblioteca espiritual. Padrão: [CATEGORIA] Sub - Assunto - Autor.mp4",
        chatPrompt: "Você é o ChatZen, um mentor acolhedor baseado na filosofia espírita."
      }
    });

    console.log("Usuário criado com sucesso!");
    return { success: true };

  } catch (error) {
    console.error("ERRO CRÍTICO NO CADASTRO:", error); // Isso vai aparecer no seu terminal (VS Code)
    return { error: "Erro interno ao criar conta. Verifique o terminal do servidor." };
  }
}