import type { Edition } from '../src/types';

export const edition: Edition = {
  year: 2025, title: 'TGA', status: 'concluded', last_updated: '', categories_count: 2,
  categories: [
    { id: 'goty', title: 'Game of the Year', winner_id: 'alpha', nominees: [
      { id: 'zeta', name: 'Zeta', winner: false },
      { id: 'alpha', name: 'Alpha', winner: false },
    ] },
    { id: 'art', title: 'Art', nominees: [
      { id: 'beta', name: 'Beta', winner: true },
      { id: 'gamma', name: 'Gamma', winner: false },
    ] },
  ],
};
