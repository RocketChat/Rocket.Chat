import { render, screen } from '@testing-library/react';

import CallTimer from './CallTimer';

/**
 * The timer reads the call's start from a conference that arrives a render after the window mounts, so what it
 * must not do is decide the call's age from the first render it happens to get.
 */
afterEach(() => {
	jest.useRealTimers();
});

it('counts from the call it is given, not from when it mounted', () => {
	jest.useFakeTimers().setSystemTime(new Date('2026-01-01T00:10:00.000Z'));

	render(<CallTimer startAt={new Date('2026-01-01T00:01:23.000Z')} />);

	expect(screen.getByText('08:37')).toBeInTheDocument();
});

it('picks the call up when it arrives a render later', () => {
	jest.useFakeTimers().setSystemTime(new Date('2026-01-01T00:10:00.000Z'));

	// What the window actually does: the conference is still loading, so there is no start yet.
	const { rerender } = render(<CallTimer />);
	expect(screen.getByText('00:00')).toBeInTheDocument();

	rerender(<CallTimer startAt={new Date('2026-01-01T00:05:00.000Z')} />);

	expect(screen.getByText('05:00')).toBeInTheDocument();
});

it('shows the hour once a call has been running that long', () => {
	jest.useFakeTimers().setSystemTime(new Date('2026-01-01T02:00:04.000Z'));

	render(<CallTimer startAt={new Date('2026-01-01T00:00:00.000Z')} />);

	expect(screen.getByText('2:00:04')).toBeInTheDocument();
});

// A workstation whose clock sits ahead of the server's would otherwise render a negative duration.
it('does not count backwards for a start in the future', () => {
	jest.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00.000Z'));

	render(<CallTimer startAt={new Date('2026-01-01T00:00:30.000Z')} />);

	expect(screen.getByText('00:00')).toBeInTheDocument();
});
