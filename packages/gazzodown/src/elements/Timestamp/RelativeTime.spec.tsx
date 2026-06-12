import { render, screen, act } from '@testing-library/react';

import TimestampWrapper from './index';
import { MarkupInteractionContext } from '../../MarkupInteractionContext';

beforeEach(() => {
	jest.useFakeTimers();
});

afterEach(() => {
	jest.useRealTimers();
});

const makeTimestampNode = (epochSeconds: number) =>
	({
		type: 'TIMESTAMP' as const,
		value: {
			timestamp: String(epochSeconds),
			format: 'R' as const,
		},
	}) satisfies Parameters<typeof TimestampWrapper>[0]['children'];

it('should update displayed text immediately when the value prop changes', () => {
	const now = new Date('2026-05-12T12:00:00.000Z');
	jest.setSystemTime(now);

	const futureA = Math.floor(now.getTime() / 1000) + 7200;
	const futureB = Math.floor(now.getTime() / 1000) + 86400;

	const { rerender } = render(<TimestampWrapper>{makeTimestampNode(futureA)}</TimestampWrapper>);

	const tagA = screen.getByText(/2 hours/i);
	expect(tagA).toBeInTheDocument();

	rerender(<TimestampWrapper>{makeTimestampNode(futureB)}</TimestampWrapper>);

	const tagB = screen.getByText(/tomorrow/i);
	expect(tagB).toBeInTheDocument();
});

it('should preserve the locale from context after interval refresh', () => {
	const now = new Date('2026-05-12T12:00:00.000Z');
	jest.setSystemTime(now);

	const futureEpoch = Math.floor(now.getTime() / 1000) + 30;

	render(
		<MarkupInteractionContext.Provider value={{ language: 'de' }}>
			<TimestampWrapper>{makeTimestampNode(futureEpoch)}</TimestampWrapper>
		</MarkupInteractionContext.Provider>,
	);

	const initial = screen.getByRole('time');
	const initialText = initial.textContent;
	expect(initialText).toBeTruthy();

	act(() => {
		jest.advanceTimersByTime(1500);
	});

	const afterTick = screen.getByRole('time');
	const afterTickText = afterTick.textContent;
	expect(afterTickText).toBeTruthy();

	expect(afterTickText).not.toMatch(/seconds/i);
});

it('should update displayed text immediately when locale changes via context', () => {
	const now = new Date('2026-05-12T12:00:00.000Z');
	jest.setSystemTime(now);

	const futureEpoch = Math.floor(now.getTime() / 1000) + 30;

	const { rerender } = render(
		<MarkupInteractionContext.Provider value={{ language: 'en' }}>
			<TimestampWrapper>{makeTimestampNode(futureEpoch)}</TimestampWrapper>
		</MarkupInteractionContext.Provider>,
	);

	expect(screen.getByRole('time').textContent).toMatch(/seconds/i);

	rerender(
		<MarkupInteractionContext.Provider value={{ language: 'de' }}>
			<TimestampWrapper>{makeTimestampNode(futureEpoch)}</TimestampWrapper>
		</MarkupInteractionContext.Provider>,
	);

	expect(screen.getByRole('time').textContent).not.toMatch(/seconds/i);
});
