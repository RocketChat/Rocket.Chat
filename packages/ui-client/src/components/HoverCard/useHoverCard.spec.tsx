import { act, fireEvent, render, screen } from '@testing-library/react';

import HoverCardPopover from './HoverCardPopover';
import { useHoverCard } from './useHoverCard';

const Harness = ({ keys }: { keys: string[] }) => {
	const hoverCard = useHoverCard<string>();

	return (
		<>
			{keys.map((key) => (
				<button key={key} type='button' onMouseEnter={(e) => hoverCard.open(e, key)} onClick={(e) => hoverCard.open(e, key)}>
					{`trigger ${key}`}
				</button>
			))}
			<HoverCardPopover hoverCard={hoverCard}>
				<div data-testid='card'>{hoverCard.shownKey}</div>
			</HoverCardPopover>
		</>
	);
};

const advance = (ms: number) =>
	act(async () => {
		await jest.advanceTimersByTimeAsync(ms);
	});

beforeEach(() => {
	jest.useFakeTimers();
});

afterEach(() => {
	jest.useRealTimers();
	delete (window as { matchMedia?: unknown }).matchMedia;
});

it('opens after the hover delay, and not if the pointer leaves first', async () => {
	render(<Harness keys={['a']} />);
	const trigger = screen.getByText('trigger a');

	fireEvent.mouseEnter(trigger);
	fireEvent.mouseLeave(trigger);
	await advance(1000);
	expect(screen.queryByTestId('card')).not.toBeInTheDocument();

	fireEvent.mouseEnter(trigger);
	await advance(499);
	expect(screen.queryByTestId('card')).not.toBeInTheDocument();
	await advance(1);
	expect(screen.getByTestId('card')).toHaveTextContent('a');
});

it('ignores the previous trigger leaving after the next one was entered', async () => {
	render(<Harness keys={['a', 'b']} />);

	// adjacent triggers: the next enter arrives before the previous leave
	fireEvent.mouseEnter(screen.getByText('trigger a'));
	fireEvent.mouseEnter(screen.getByText('trigger b'));
	fireEvent.mouseLeave(screen.getByText('trigger a'));
	await advance(500);

	expect(screen.getByTestId('card')).toHaveTextContent('b');
});

it('opens right away on click', async () => {
	render(<Harness keys={['a']} />);

	fireEvent.click(screen.getByText('trigger a'));
	await advance(0);

	expect(screen.getByTestId('card')).toHaveTextContent('a');
});

it('does not open on hover where the device cannot hover, but still opens on click', async () => {
	Object.defineProperty(window, 'matchMedia', {
		configurable: true,
		value: (query: string) => ({ matches: query !== '(hover: hover)', media: query }),
	});
	render(<Harness keys={['a']} />);

	fireEvent.mouseEnter(screen.getByText('trigger a'));
	await advance(1000);
	expect(screen.queryByTestId('card')).not.toBeInTheDocument();

	fireEvent.click(screen.getByText('trigger a'));
	await advance(0);
	expect(screen.getByTestId('card')).toHaveTextContent('a');
});

it('lingers after the pointer leaves, then closes', async () => {
	render(<Harness keys={['a']} />);
	const trigger = screen.getByText('trigger a');

	fireEvent.mouseEnter(trigger);
	await advance(500);
	fireEvent.mouseLeave(trigger);
	await advance(299);
	expect(screen.getByTestId('card')).toBeInTheDocument();
	await advance(1);
	expect(screen.queryByTestId('card')).not.toBeInTheDocument();
});
