import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ErrorToast } from './ErrorToast';

describe('ErrorToast', () => {
  it('renders the error message', () => {
    render(<ErrorToast message="Test error" onClose={() => {}} />);
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<ErrorToast message="Test error" onClose={onClose} />);

    const closeButton = screen.getAllByRole('button')[0];
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose automatically after 5 seconds', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    render(<ErrorToast message="Test error" onClose={onClose} />);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(onClose).toHaveBeenCalled();
    vi.useRealTimers();
  });
});
