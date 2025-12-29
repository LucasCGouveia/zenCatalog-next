"use client";
import { useState } from "react";

export function ChatInterface() {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState<any[]>([]);

  const handleSend = async () => {
    // Aqui chamaremos a Server Action do Chat
    // const result = await askAIAction(message);
    // setResponse(result);
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 rounded-xl shadow-inner">
      <div className="flex-1 p-6 overflow-y-auto">
        {/* Aqui aparecem as sugestões da IA */}
        <p className="text-gray-400 italic">Como posso te ajudar hoje?</p>
      </div>
      
      <div className="p-4 bg-gray-900/50">
        <div className="flex gap-2">
          <input 
            className="flex-1 bg-gray-700 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ex: Sugira uma aula sobre Atitude..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button onClick={handleSend} className="bg-blue-600 px-4 py-2 rounded-lg">Enviar</button>
        </div>
      </div>
    </div>
  );
}