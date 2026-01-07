
export enum Category {
  ESP = '[ESP]',
  HIST = '[HIST]',
  FILO = '[FILO]',
  DICA = '[DICA]',
  POEMA = '[POEMA]',
  FAMILY = 'FAMILY',
  ELA = 'É Ela',
  OUTROS = 'OUTROS',
}

export interface VideoAnalysis {
  category: Category;
  subcategory: string;
  subject: string;
  author: string;
  suggestedFilename: string;
  summary: string;
  duration?: string;
  priority?: number;
}

export interface CatalogItem extends VideoAnalysis {
  id: string;
  timestamp: number;
  isWatchEveryDay: boolean;
  originalName?: string;
  fileName: string; // <--- O nome real do vídeo
  createdAt?: string | Date; 
  updatedAt?: string | Date;
}
