import type { UserCardContextValue } from '@rocket.chat/ui-contexts';
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
	default: ({ username }: { username: string }) => <div data-testid='user-card'>{username}</div>,
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

it('opens on hover after the intent delay, and not if the pointer leaves first', async () => {
	jest.useFakeTimers();
	try {
		render(
			<UserCardProvider>
				<HoverTrigger />
			</UserCardProvider>,
		);

		fireEvent.mouseEnter(screen.getByText('hover'));
		fireEvent.mouseLeave(screen.getByText('hover'));
		await act(async () => {
			await jest.advanceTimersByTimeAsync(1000);
		});
		expect(screen.queryByTestId('user-card')).not.toBeInTheDocument();

		fireEvent.mouseEnter(screen.getByText('hover'));
		await act(async () => {
			await jest.advanceTimersByTimeAsync(499);
		});
		expect(screen.queryByTestId('user-card')).not.toBeInTheDocument();

		await act(async () => {
			await jest.advanceTimersByTimeAsync(1);
		});
		expect(screen.getByTestId('user-card')).toBeInTheDocument();
	} finally {
		jest.useRealTimers();
	}
});

it('keeps the context value stable when a card opens and closes', async () => {
	const values: UserCardContextValue[] = [];

	const RecordingTrigger = () => {
		const value = useUserCard();
		values.push(value);
		return (
			<>
				<button type='button' {...value.triggerProps} onClick={(e: UIEvent) => value.openUserCard(e, 'john')}>
					open
				</button>
				<button type='button' onClick={value.closeUserCard}>
					close
				</button>
			</>
		);
	};

	render(
		<UserCardProvider>
			<RecordingTrigger />
		</UserCardProvider>,
	);

	fireEvent.click(screen.getByText('open'));
	expect(await screen.findByTestId('user-card')).toBeInTheDocument();

	fireEvent.click(screen.getByText('close'));
	await waitFor(() => expect(screen.queryByTestId('user-card')).not.toBeInTheDocument());

	expect(new Set(values).size).toBe(1);
	expect(screen.getByText('open')).not.toHaveAttribute('aria-expanded');
});

const AuthorTrigger = ({ username }: { username: string }) => {
	const { openUserCard } = useUserCard();
	return (
		<button type='button' onMouseEnter={(e: UIEvent) => openUserCard(e, username)}>
			{`author ${username}`}
		</button>
	);
};

const advance = (ms: number) =>
	act(async () => {
		await jest.advanceTimersByTimeAsync(ms);
	});

it('closes shortly after the pointer leaves the card and its trigger', async () => {
	jest.useFakeTimers();
	try {
		render(
			<UserCardProvider>
				<AuthorTrigger username='jane' />
			</UserCardProvider>,
		);

		const trigger = screen.getByText('author jane');
		fireEvent.mouseEnter(trigger);
		await advance(1000);
		const card = screen.getByTestId('user-card').parentElement as HTMLElement;

		// from the trigger into the card: it stays open
		fireEvent.mouseLeave(trigger);
		fireEvent.mouseEnter(card);
		await advance(1000);
		expect(screen.getByTestId('user-card')).toHaveTextContent('jane');

		// out of the card: it lingers, then closes
		fireEvent.mouseLeave(card);
		await advance(299);
		expect(screen.getByTestId('user-card')).toBeInTheDocument();
		await advance(1);
		expect(screen.queryByTestId('user-card')).not.toBeInTheDocument();
	} finally {
		jest.useRealTimers();
	}
});

it('hands the card over to the next author the pointer moves to', async () => {
	jest.useFakeTimers();
	try {
		render(
			<UserCardProvider>
				<AuthorTrigger username='jane' />
				<AuthorTrigger username='john' />
			</UserCardProvider>,
		);

		fireEvent.mouseEnter(screen.getByText('author jane'));
		await advance(1000);
		expect(screen.getByTestId('user-card')).toHaveTextContent('jane');

		// with a card already showing, the next author's card replaces it without waiting out the hover delay
		fireEvent.mouseLeave(screen.getByText('author jane'));
		fireEvent.mouseEnter(screen.getByText('author john'));
		await advance(0);
		expect(screen.getByTestId('user-card')).toHaveTextContent('john');

		// the pointer resting on john's name keeps his card open
		await advance(1000);
		expect(screen.getByTestId('user-card')).toHaveTextContent('john');
	} finally {
		jest.useRealTimers();
	}
});

it('does not bring the card back after scrolling dismisses it', async () => {
	jest.useFakeTimers();
	try {
		render(
			<UserCardProvider>
				<AuthorTrigger username='jane' />
				<AuthorTrigger username='john' />
			</UserCardProvider>,
		);

		fireEvent.mouseEnter(screen.getByText('author jane'));
		await advance(1000);
		expect(screen.getByTestId('user-card')).toBeInTheDocument();

		// an open for john is pending when scrolling the list (which holds the trigger) dismisses the card
		fireEvent.mouseEnter(screen.getByText('author john'));
		fireEvent.scroll(document.body);
		await advance(0);
		expect(screen.queryByTestId('user-card')).not.toBeInTheDocument();

		await advance(1000);
		expect(screen.queryByTestId('user-card')).not.toBeInTheDocument();
	} finally {
		jest.useRealTimers();
	}
});

it('keeps the card open while its own menu is open, and closes once that menu closes with the pointer elsewhere', async () => {
	jest.useFakeTimers();
	try {
		render(
			<UserCardProvider>
				<AuthorTrigger username='jane' />
			</UserCardProvider>,
		);

		const trigger = screen.getByText('author jane');
		fireEvent.mouseEnter(trigger);
		await advance(1000);
		const content = screen.getByTestId('user-card');
		const card = content.parentElement as HTMLElement;

		// the card's kebab opens its menu, portaled outside the card, and the pointer follows it there
		fireEvent.mouseLeave(trigger);
		fireEvent.mouseEnter(card);
		await act(async () => content.setAttribute('aria-expanded', 'true'));
		fireEvent.mouseLeave(card);
		await advance(1000);
		expect(screen.getByTestId('user-card')).toBeInTheDocument();

		// the menu closes with the pointer still outside the card
		await act(async () => content.setAttribute('aria-expanded', 'false'));
		await advance(1000);
		expect(screen.queryByTestId('user-card')).not.toBeInTheDocument();
	} finally {
		jest.useRealTimers();
	}
});

it('opens a hover card as a pointer-only preview that neither takes focus nor marks its trigger', async () => {
	jest.useFakeTimers();
	try {
		render(
			<UserCardProvider>
				<AuthorTrigger username='jane' />
			</UserCardProvider>,
		);

		const trigger = screen.getByText('author jane');
		trigger.focus();
		fireEvent.mouseEnter(trigger);
		await advance(1000);

		expect(screen.getByTestId('user-card')).toHaveTextContent('jane');
		expect(trigger).toHaveFocus();
		expect(trigger).not.toHaveAttribute('aria-expanded');
	} finally {
		jest.useRealTimers();
	}
});

it('stays open while the pointer is on the trigger and the card renders its collapsed menu trigger', async () => {
	jest.useFakeTimers();
	try {
		render(
			<UserCardProvider>
				<AuthorTrigger username='jane' />
			</UserCardProvider>,
		);

		fireEvent.mouseEnter(screen.getByText('author jane'));
		await advance(1000);

		// the loaded card brings its kebab, collapsed
		await act(async () => screen.getByTestId('user-card').setAttribute('aria-expanded', 'false'));
		await advance(1000);
		expect(screen.getByTestId('user-card')).toBeInTheDocument();
	} finally {
		jest.useRealTimers();
	}
});

it('stays open when the pointer jumps straight from the trigger onto the card', async () => {
	jest.useFakeTimers();
	try {
		render(
			<UserCardProvider>
				<AuthorTrigger username='jane' />
			</UserCardProvider>,
		);

		const trigger = screen.getByText('author jane');
		fireEvent.mouseEnter(trigger);
		await advance(1000);
		const card = screen.getByTestId('user-card').parentElement as HTMLElement;

		// a single fast move: the browser fires every pointer event before the matching mouse events
		fireEvent.pointerLeave(trigger);
		fireEvent.pointerEnter(card);
		fireEvent.mouseLeave(trigger);
		fireEvent.mouseEnter(card);
		await advance(1000);

		expect(screen.getByTestId('user-card')).toBeInTheDocument();
	} finally {
		jest.useRealTimers();
	}
});
