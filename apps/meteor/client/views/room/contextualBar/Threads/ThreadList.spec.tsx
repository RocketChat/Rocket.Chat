import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VirtuosoMockContext } from 'react-virtuoso';

import ThreadList from './ThreadList';
import { createFakeRoom } from '../../../../../tests/mocks/data';

const fakeRoom = createFakeRoom({ t: 'c' });

jest.mock('./components/ThreadListItem', () => <></>);
jest.mock('../../contexts/RoomContext', () => ({
	useRoom: () => fakeRoom,
	useRoomSubscription: () => fakeRoom,
}));

// TODO: Create a function to mock the lib/i18n to be used with mockAppRoot
jest.mock('../../../../../lib/i18n', () => ({
	t: (key: string) => key,
}));

describe('ThreadList Component', () => {
	it('should display an error message when in error state', async () => {
		render(<ThreadList />, {
			wrapper: mockAppRoot()
				.withRoom(fakeRoom)
				.withEndpoint(
					'GET',
					'/v1/chat.getThreadsList',
					jest.fn().mockRejectedValue({ success: false, error: 'error-not-allowed', errorType: 'error-not-allowed' }),
				)
				.wrap((children) => (
					<VirtuosoMockContext.Provider value={{ viewportHeight: 300, itemHeight: 100 }}>{children}</VirtuosoMockContext.Provider>
				))
				.build(),
		});
		expect(await screen.findByText('error-not-allowed')).toBeInTheDocument();
	});

	it('should request only the threads with drafts when the drafts filter is selected', async () => {
		const getThreadsList = jest.fn().mockResolvedValue({ threads: [], total: 0, count: 0, offset: 0 });

		render(<ThreadList />, {
			wrapper: mockAppRoot().withJohnDoe().withRoom(fakeRoom).withEndpoint('GET', '/v1/chat.getThreadsList', getThreadsList).build(),
		});

		await userEvent.click(screen.getByRole('combobox', { name: 'Filter' }));
		await userEvent.click(await screen.findByRole('option', { name: 'Drafts' }));

		await waitFor(() => expect(getThreadsList).toHaveBeenCalledWith(expect.objectContaining({ type: 'drafts' })));
	});
});
