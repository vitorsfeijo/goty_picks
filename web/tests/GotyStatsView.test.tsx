import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { GotyStatsView } from '../src/components/GotyStatsView';
import { edition } from './fixtures';

vi.mock('../src/hooks/useGotyHistory', () => ({ useGotyHistory: () => ({
  data: [{ edition, distribution: [
    { category_id: 'goty', nominee_id: 'alpha', total_votes: 12 },
    { category_id: 'goty', nominee_id: 'zeta', total_votes: 8 },
  ] }], loading: false, failedYears: [], retry: vi.fn(),
}) }));

it('shows collective totals and percentages without personal highlights', () => {
  localStorage.setItem('goty_picks_ballot_2025', JSON.stringify({ goty: 'zeta' }));
  render(<GotyStatsView editions={[]} onChooseYear={vi.fn()} />);
  expect(screen.getByText('20 votos nesta edição')).toBeInTheDocument();
  expect(screen.getByText('12 · 60%')).toBeInTheDocument();
  expect(screen.getByText('8 · 40%')).toBeInTheDocument();
  expect(screen.getByText('edições com dados da comunidade')).toBeInTheDocument();
  expect(screen.queryByText(/minha escolha|suas escolhas de GOTY/i)).not.toBeInTheDocument();
});
