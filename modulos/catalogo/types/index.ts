
export enum Category {
  ESP = '[ESP]',
  HIST = '[HIST]',
  FILO = '[FILO]',
  DICA = '[DICA]',
  POEMA = '[POEMA]'
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
}
