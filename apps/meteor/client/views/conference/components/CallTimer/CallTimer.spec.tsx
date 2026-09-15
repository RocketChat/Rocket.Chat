import { CallTimer } from '@rocket.chat/ui-client';
import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';

import * as stories from './CallTimer.stories';

/**
 * The timer reads the call's start from a conference that arrives a render after the window mounts, so what it
 * must not do is decide the call's age from the first render it happens to get.
 */
afterEach(() => {
	jest.useRealTimers();
});

/**
 * The stories are snapshotted with the clock held still. A timer is the one thing a snapshot cannot take a
 * picture of while it runs — the value would be a second older on the next run — so the story's fixed start and
 * a fixed now are what make the picture the same picture twice.
 */
const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story] as const);

test.each(testCases)(`renders %s without crashing`, async (_storyname, Story) => {
	jest.useFakeTimers().setSystemTime(new Date('2026-01-01T02:00:04.000Z'));

	const { baseElement } = render(<Story />);

	expect(baseElement).toMatchSnapshot();
});

// On the real clock: `axe` schedules its own work, and a frozen timer never lets it finish.
test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
	const { container } = render(<Story />);

	const results = await axe(container);
	expect(results).toHaveNoViolations();
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

// A counting clock is a live region, and its role is what anything else can refer to it by.
it('is a timer', () => {
	render(<CallTimer startAt={new Date()} />);

	expect(screen.getByRole('timer')).toBeInTheDocument();
});
