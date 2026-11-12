import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Inbox from './Inbox';

jest.mock('./RoomList', () => ({
	__esModule: true,
	default: ({ filterText }: { filterText: string }) => <div data-testid='room-list'>{filterText}</div>,
}));

const appRoot = mockAppRoot().build();

it('filters the room list while the search is open, and clears the filter and returns focus to the search button when Esc closes it', async () => {
	render(<Inbox />, { wrapper: appRoot });

	await userEvent.click(screen.getByRole('button', { name: 'Search_rooms' }));
	await userEvent.type(screen.getByRole('textbox', { name: 'Search_rooms' }), 'sup');

	await waitFor(() => expect(screen.getByTestId('room-list')).toHaveTextContent('sup'));

	await userEvent.keyboard('{Escape}');

	expect(screen.queryByRole('textbox', { name: 'Search_rooms' })).not.toBeInTheDocument();
	expect(screen.getByTestId('room-list')).toBeEmptyDOMElement();
	expect(screen.getByRole('button', { name: 'Search_rooms' })).toHaveAttribute('aria-expanded', 'false');
	expect(screen.getByRole('button', { name: 'Search_rooms' })).toHaveFocus();
});
