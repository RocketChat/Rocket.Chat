import type { UserCardContextValue } from '@rocket.chat/ui-contexts';
import { useUserCard } from '@rocket.chat/ui-contexts';
import { render, screen, fireEvent } from '@testing-library/react';
import type { UIEvent } from 'react';

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

it('keeps the context value stable when a card opens and closes', async () => {
	const values: UserCardContextValue[] = [];

	const Trigger = () => {
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
			<Trigger />
		</UserCardProvider>,
	);

	fireEvent.click(screen.getByRole('button', { name: 'open' }));
	expect(await screen.findByTestId('user-card')).toBeInTheDocument();

	fireEvent.click(screen.getByText('close'));
	expect(screen.queryByTestId('user-card')).not.toBeInTheDocument();

	expect(new Set(values).size).toBe(1);
	expect(screen.getByText('open')).not.toHaveAttribute('aria-expanded');
});

it('marks only the trigger that opened the card as expanded', async () => {
	const AuthorTrigger = ({ username }: { username: string }) => {
		const { openUserCard, triggerProps } = useUserCard();
		return (
			<button type='button' {...triggerProps} onClick={(e: UIEvent) => openUserCard(e, username)}>
				<span>{`author ${username}`}</span>
			</button>
		);
	};

	render(
		<UserCardProvider>
			<AuthorTrigger username='jane' />
			<AuthorTrigger username='john' />
		</UserCardProvider>,
	);

	const jane = screen.getByText('author jane').closest('button');
	const john = screen.getByText('author john').closest('button');

	// clicking the inner text still marks the button, not the span
	fireEvent.click(screen.getByText('author jane'));
	expect(await screen.findByTestId('user-card')).toBeInTheDocument();

	expect(jane).toHaveAttribute('aria-expanded', 'true');
	expect(john).not.toHaveAttribute('aria-expanded');
	expect(jane).toHaveAttribute('aria-haspopup', 'dialog');
	expect(john).toHaveAttribute('aria-haspopup', 'dialog');
});
