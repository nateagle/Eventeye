
export interface SubItem {
  id: string;
  name: string;
  amount: number;
  deadline?: string; // ISO string YYYY-MM-DD
}

export interface BudgetItem {
  id: string;
  category: string;
  name: string;
  amount: number;
  subItems?: SubItem[];
  deadline?: string; // ISO string YYYY-MM-DD
}

export interface EventBudget {
  id: string;
  eventName: string;
  date: string;
  items: BudgetItem[];
}

export type AppView = 'dashboard' | 'editor' | 'planner';

export interface EditedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
}
