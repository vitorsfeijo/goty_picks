import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CategoryCard } from '../src/components/CategoryCard';
import { edition } from './fixtures';

describe('category voting UI', () => {
  it('sorts nominees alphabetically and sends the selected IDs', () => {
    const onVote = vi.fn();
    render(<CategoryCard category={edition.categories[0]} onVote={onVote} isConcluded={false} />);
    expect(screen.getAllByRole('button').map(b => b.textContent)).toEqual(['Alpha', 'Zeta']);
    fireEvent.click(screen.getByRole('button', { name: 'Alpha' }));
    expect(onVote).toHaveBeenCalledWith('goty', 'alpha');
    expect(edition.categories[0].nominees[0].id).toBe('zeta');
  });
  it('hides spoilers until reveal is requested', () => {
    const props = { category: edition.categories[0], onVote: vi.fn(), isConcluded: true };
    const { rerender } = render(<CategoryCard {...props} />);
    expect(screen.queryByText('Vencedor oficial')).not.toBeInTheDocument();
    rerender(<CategoryCard {...props} revealAll />);
    expect(screen.getByText('Vencedor oficial')).toBeInTheDocument();
  });
  it.each(['alpha', 'zeta'])('values pick %s equally regardless of official winner', pick => {
    render(<CategoryCard category={edition.categories[0]} onVote={vi.fn()} isConcluded selectedNomineeId={pick} />);
    expect(screen.getByText('Minha escolha')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: new RegExp(pick === 'alpha' ? 'Alpha' : 'Zeta') })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByText(/Acertou|Errou|Ponto/)).not.toBeInTheDocument();
    expect(screen.queryByText('Vencedor oficial')).not.toBeInTheDocument();
  });
  it('prevents clicks while voting is locked', () => {
    const onVote = vi.fn();
    render(<CategoryCard category={edition.categories[0]} onVote={onVote} isConcluded={false} isVotingOpen={false} />);
    for (const button of screen.getAllByRole('button')) {
      expect(button).toBeDisabled();
      fireEvent.click(button);
    }
    expect(onVote).not.toHaveBeenCalled();
  });
});
