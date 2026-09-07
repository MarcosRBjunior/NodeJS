import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CategoryBadge } from './CategoryBadge';

describe('CategoryBadge', () => {
  it('renderiza o texto da categoria', () => {
    render(<CategoryBadge categoria="Tecnologia" />);
    expect(screen.getByText('Tecnologia')).toBeInTheDocument();
  });

  it('aplica a classe correspondente para Idiomas', () => {
    render(<CategoryBadge categoria="Idiomas" />);
    expect(screen.getByText('Idiomas')).toHaveClass('badge--idiomas');
  });

  it('não renderiza nada quando não há categoria', () => {
    const { container } = render(<CategoryBadge categoria={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
