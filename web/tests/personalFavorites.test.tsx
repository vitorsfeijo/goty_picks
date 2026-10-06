import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { CategoryStatsTable } from '../src/components/CategoryStatsTable';
import { generateBallotCanvas } from '../src/utils/generateShareCard';
import { edition } from './fixtures';

afterEach(() => vi.restoreAllMocks());

it('finds consensus by preference even when the favorite lost officially', () => {
  render(<CategoryStatsTable edition={edition} userVotes={{ art: 'gamma' }} realDistribution={[
    { category_id: 'goty', nominee_id: 'alpha', total_votes: 6 },
    { category_id: 'goty', nominee_id: 'zeta', total_votes: 4 },
    { category_id: 'art', nominee_id: 'gamma', total_votes: 9 },
    { category_id: 'art', nominee_id: 'beta', total_votes: 1 },
  ]} />);
  expect(screen.getByRole('heading', { name: 'Gamma' })).toBeInTheDocument();
  expect(screen.getByText('90% das escolhas em Art')).toBeInTheDocument();
  expect(screen.queryByText(/acerto|erro|zebra/i)).not.toBeInTheDocument();
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Art' } });
  expect(screen.getByRole('heading', { name: 'Art' })).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Game of the Year' })).not.toBeInTheDocument();
});

it('shares favorites and completion without evaluating the choices', async () => {
  const fillText = vi.fn();
  const gradient = { addColorStop: vi.fn() };
  const context = new Proxy({
    fillText,
    measureText: (text: string) => ({ width: text.length * 10 }),
    createLinearGradient: () => gradient,
    createRadialGradient: () => gradient,
  }, { get: (target, key) => Reflect.get(target, key) ?? vi.fn() });
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D);
  await generateBallotCanvas({ edition, votes: { goty: 'zeta', art: 'gamma' }, displayName: 'Player', totalVoted: 2, totalCategories: 2 });
  const labels = fillText.mock.calls.map(call => call[0]).join('\n');
  expect(labels).toContain('Os favoritos de Player');
  expect(labels).toContain('2 de 2 categorias com a minha escolha');
  expect(labels).toContain('Zeta');
  expect(labels).not.toMatch(/acertos|aproveitamento|palpite/i);
});
