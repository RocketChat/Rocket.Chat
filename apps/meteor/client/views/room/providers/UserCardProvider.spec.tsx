import { useUserCard } from '@rocket.chat/ui-contexts';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
