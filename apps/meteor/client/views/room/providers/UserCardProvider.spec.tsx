import { useUserCard } from '@rocket.chat/ui-contexts';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { useEffect, useRef, type ReactNode, type UIEvent } from 'react';

import UserCardProvider from './UserCardProvider';

jest.mock('../contexts/RoomContext', () => ({
	useRoom: () => ({ _id: 'r1', t: 'c', uids: [] }),
}));

jest.mock('@rocket.chat/ui-contexts', () => {
	const actual = jest.requireActual('@rocket.chat/ui-contexts');
	return { ...actual, useRoomToolbox: () => ({ openTab: jest.fn() }) };
});

jest.mock('../UserCard', () => ({
	__esModule: true,
	default: () => <div data-testid='user-card'>card</div>,
}));

const Trigger = () => {
	const { openUserCard } = useUserCard();
	return (
		<button type='button' onClick={(e: UIEvent) => openUserCard(e, 'john')}>
			open
		</button>
	);
};

// Stands in for a contextual bar / search panel that closes on a bubbling Escape.
const EscapeListener = ({ onEscape, children }: { onEscape: () => void; children: ReactNode }) => {
	const ref = useRef<HTMLDivElement>(null);
	useEffect(() => {
		const node = ref.current;
		const handler = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				onEscape();
			}
		};
		node?.addEventListener('keydown', handler);
		return () => node?.removeEventListener('keydown', handler);
	}, [onEscape]);
	return <div ref={ref}>{children}</div>;
};

it('consumes Escape while the card is open so an underlying handler does not also fire', async () => {
	const underlyingEscape = jest.fn();

	render(
		<EscapeListener onEscape={underlyingEscape}>
			<UserCardProvider>
				<Trigger />
			</UserCardProvider>
		</EscapeListener>,
	);

	fireEvent.click(screen.getByText('open'));
	await screen.findByTestId('user-card');

	fireEvent.keyDown(screen.getByText('open'), { key: 'Escape' });

	await waitFor(() => expect(screen.queryByTestId('user-card')).not.toBeInTheDocument());
	expect(underlyingEscape).not.toHaveBeenCalled();
});

it('does not consume Escape while a menu is open, leaving the card as it is', async () => {
	const underlyingEscape = jest.fn();

	render(
		<EscapeListener onEscape={underlyingEscape}>
			<UserCardProvider>
				<Trigger />
			</UserCardProvider>
			{/* Inert stand-in for the kebab actions menu (portaled outside the card in production,
			    where it handles and stops the Escape itself). Here it only signals "a menu is open". */}
			<div role='menu' />
		</EscapeListener>,
	);

	fireEvent.click(screen.getByText('open'));
	await screen.findByTestId('user-card');

	fireEvent.keyDown(screen.getByText('open'), { key: 'Escape' });

	// The provider neither stops the event nor closes the card: the stand-in is inert,
	// so the event reaching the underlying listener proves it went through untouched.
	expect(underlyingEscape).toHaveBeenCalledTimes(1);
	expect(screen.getByTestId('user-card')).toBeInTheDocument();
});

const HoverTrigger = () => {
	const { openUserCard } = useUserCard();
	return (
		<button type='button' onMouseEnter={(e: UIEvent) => openUserCard(e, 'jane')}>
			hover
		</button>
	);
};

it('cancels a pending hover open when Escape dismisses the card', async () => {
	jest.useFakeTimers();
	try {
		render(
			<UserCardProvider>
				<Trigger />
				<HoverTrigger />
			</UserCardProvider>,
		);

		fireEvent.click(screen.getByText('open'));
		await act(async () => {
			await jest.advanceTimersByTimeAsync(0);
		});
		expect(screen.getByTestId('user-card')).toBeInTheDocument();

		// pointer reaches another author: an open is now pending behind the hover delay
		fireEvent.mouseEnter(screen.getByText('hover'));
		fireEvent.keyDown(screen.getByText('open'), { key: 'Escape' });

		await act(async () => {
			await jest.advanceTimersByTimeAsync(1000);
		});

		// the explicit dismissal wins: no card comes back once the hover delay elapses
		expect(screen.queryByTestId('user-card')).not.toBeInTheDocument();
	} finally {
		jest.useRealTimers();
	}
});
