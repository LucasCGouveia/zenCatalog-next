type ConversationMessage = {
  role: string;
  content: string;
};

export function formatConversationHistory(messages: ConversationMessage[]) {
  return messages
    .map((message) => {
      const speaker = message.role === "assistant" ? "ChatZen" : "Usuário";
      return `${speaker}: ${message.content}`;
    })
    .join("\n\n");
}

export function buildChatPrompt(input: {
  systemInstruction: string;
  conversationHistory: string;
  contextText: string;
  question: string;
}) {
  return `
INSTRUÇÕES DO SISTEMA:
${input.systemInstruction}

HISTÓRICO DA CONVERSA ATUAL:
${input.conversationHistory || "Esta é a primeira mensagem desta conversa."}

REGRA ESTRITA DE ACESSO:
Você TEM acesso ao catálogo de vídeos do usuário. Os resultados relevantes do banco de dados foram buscados e injetados abaixo.
Nunca diga que não tem acesso ao catálogo. Use o contexto quando ele for relevante e deixe claro quando estiver complementando com conhecimento geral.

REGRA DE CITAÇÃO:
Sempre que utilizar um vídeo ou documento do contexto, escreva o nome exato e completo da fonte em negrito. Não abrevie nem remova a extensão.

CONTEXTO DO ACERVO PESSOAL:
${input.contextText || "Nenhum item específico do catálogo correspondeu a esta busca."}

PERGUNTA ATUAL DO USUÁRIO:
${input.question}
`.trim();
}
