"use client";

import React, { useState, useEffect } from 'react';
import { HistoryList } from '@/modulos/catalogo/components/HistoryList';
import { ChatInterface } from '@/modulos/chat/components/ChatInterface';
import { CatalogItem } from '@/modulos/catalogo/types';
import { deleteCatalogAction } from '@/modulos/catalogo/actions/catalogActions';

export default function Page() {
  const [history, setHistory] = useState<CatalogItem[]>([]);

  useEffect(() => {
    fetch('/api/catalogo').then(res => res.json()).then(setHistory);
  }, []);

  const handleDelete = async (id: string) => {
    await deleteCatalogAction(id);
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <section className="space-y-4">
        <h1 className="text-2xl font-bold">O que vamos estudar hoje?</h1>
        <div className="h-[450px] bg-gray-900/50 rounded-2xl border border-gray-800 shadow-2xl">
          <ChatInterface />
        </div>
      </section>

      <section className="space-y-6">
        <h3 className="text-xl font-bold border-b border-gray-800 pb-2">Sua Biblioteca</h3>
        <HistoryList items={history} onDelete={handleDelete} />
      </section>
    </div>
  );
}