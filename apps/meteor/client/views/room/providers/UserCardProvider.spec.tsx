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
			await jest.advanceTimersByTimeAsync(1000);
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

		fireEvent.mouseEnter(screen.getByText('author jane'));
		await advance(1000);
		expect(screen.getByTestId('user-card')).toHaveTextContent('jane');

		// far from the card and the trigger
		fireEvent.mouseMove(document, { clientX: 500, clientY: 500 });
		await advance(1000);

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

		fireEvent.mouseLeave(screen.getByText('author jane'));
		fireEvent.mouseEnter(screen.getByText('author john'));
		fireEvent.mouseMove(document, { clientX: 500, clientY: 500 });
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

it('marks only the trigger that opened the card as expanded', async () => {
	const ClickTrigger = ({ username }: { username: string }) => {
		const { openUserCard, triggerProps } = useUserCard();
		return (
			<button type='button' {...triggerProps} onClick={(e: UIEvent) => openUserCard(e, username)}>
				<span>{`click ${username}`}</span>
			</button>
		);
	};

	render(
		<UserCardProvider>
			<ClickTrigger username='jane' />
			<ClickTrigger username='john' />
		</UserCardProvider>,
	);

	const jane = screen.getByText('click jane').closest('button');
	const john = screen.getByText('click john').closest('button');

	// clicking the inner text still marks the button, not the span
	fireEvent.click(screen.getByText('click jane'));
	expect(await screen.findByTestId('user-card')).toBeInTheDocument();

	expect(jane).toHaveAttribute('aria-expanded', 'true');
	expect(john).not.toHaveAttribute('aria-expanded');
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
