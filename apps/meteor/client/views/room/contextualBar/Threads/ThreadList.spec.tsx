import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
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
jest.mock('../../../../../app/utils/lib/i18n', () => ({
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
});
