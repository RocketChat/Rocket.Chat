import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import { VirtuosoMockContext } from 'react-virtuoso';

import ThreadList from './ThreadList';
import { createFakeRoom } from '../../../../../tests/mocks/data';

const fakeRoom = createFakeRoom({ t: 'c' });
const fakeSubscription = { ...fakeRoom, threadDrafts: { 'thread-with-draft': 'unsent reply' } };

jest.mock('./components/ThreadListItem', () => <></>);
jest.mock('../../contexts/RoomContext', () => ({
	useRoom: () => fakeRoom,
	useRoomSubscription: () => fakeSubscription,
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
		window.localStorage.setItem('thread-list-type', JSON.stringify('drafts'));
		const getThreadsList = jest.fn().mockResolvedValue({ threads: [], total: 0, count: 0, offset: 0 });

		render(<ThreadList />, {
			wrapper: mockAppRoot().withRoom(fakeRoom).withEndpoint('GET', '/v1/chat.getThreadsList', getThreadsList).build(),
		});

		expect(await screen.findByText('No_Threads')).toBeInTheDocument();
		expect(getThreadsList).toHaveBeenCalledWith(expect.objectContaining({ rid: fakeRoom._id, type: 'drafts' }));

		window.localStorage.removeItem('thread-list-type');
	});
});
