export interface Nominee {
  id: string;
  name: string;
  details?: string | null;
  winner: boolean;
  image_url?: string | null;
}

export interface Category {
  id: string;
  title: string;
  nominees: Nominee[];
  winner_id?: string | null;
}

export type EditionStatus = 'open' | 'locked' | 'concluded';

export interface Edition {
  year: number;
  title: string;
  status: EditionStatus;
  last_updated: string;
  categories_count: number;
  categories: Category[];
}

export interface EditionSummary {
  year: number;
  title: string;
  status: EditionStatus;
  categories_count: number;
  has_winners: boolean;
  url?: string;
}

/**
 * Maps categoryId -> chosen nomineeId
 * e.g. { "jogo-do-ano": "clair-obscur-expedition-33" }
 */
export type UserVotes = Record<string, string>;
