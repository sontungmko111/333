
export interface ImageState {
  original: string | null;
  reference: string | null;
  modified: string | null;
  loading: boolean;
  error: string | null;
}

export interface HistoryItem {
  id: string;
  original: string;
  reference: string | null;
  modified: string;
  prompt: string;
  timestamp: number;
}
