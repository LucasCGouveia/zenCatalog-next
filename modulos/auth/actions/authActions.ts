'use server'

import { prisma } from "@/lib/prisma";
import { hash } from "bcrypt-ts";

export async function registerUserAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;

  if (!email || !password || !name) {
    return { error: "Todos os campos são obrigatórios." };
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return { error: "Este e-mail já está em uso." };
    }

    const hashedPassword = await hash(password, 10);

    await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        // Já criamos os prompts padrão para o novo usuário
        systemPrompt: "Você é um organizador de biblioteca espiritual. Padrão: [CATEGORIA] Sub - Assunto - Autor.mp4",
        chatPrompt: "Você é o ChatZen, um mentor acolhedor baseado na filosofia espírita."
      }
    });

    return { success: true };
  } catch (error) {
    console.error("Erro no cadastro:", error);
    return { error: "Erro interno ao criar conta." };
  }
}