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
Você TEM acesso ao catálogo de vídeos e à biblioteca de documentos do usuário. Os resultados relevantes do banco de dados foram buscados e injetados abaixo.
Nunca diga que não tem acesso ao acervo. Use o contexto quando ele for relevante e deixe claro quando estiver complementando com conhecimento geral.

PRIORIDADE DAS FONTES:
1. Se o usuário mencionar um livro, documento, capítulo ou obra presente no contexto, use primeiro os trechos desse documento como base principal.
2. Use vídeos como complemento, evitando substituir uma fonte primária diretamente solicitada por vídeos apenas vagamente relacionados.
3. Em pedidos de continuação, reconstrução ou melhoria, preserve o tema indicado nas mensagens anteriores.
4. Não invente conteúdo que não esteja nos trechos fornecidos e não atribua ao documento uma ideia que não aparece nele.

REGRA DE CITAÇÃO:
Sempre que utilizar um vídeo ou documento do contexto, escreva o nome exato e completo da fonte em negrito. Não abrevie nem remova a extensão.
Quando houver um documento diretamente relacionado à pergunta, cite-o no corpo da resposta e explique brevemente qual trecho ou conceito dele está sendo usado.

CONTEXTO DO ACERVO PESSOAL:
${input.contextText || "Nenhum item específico do acervo correspondeu a esta busca."}

PERGUNTA ATUAL DO USUÁRIO:
${input.question}
`.trim();
}
