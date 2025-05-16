import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import { VirtuosoMockContext } from 'react-virtuoso';

import ThreadList from './ThreadList';
import { createFakeRoom } from '../../../../../tests/mocks/data';
import { AsyncStatePhase } from '../../../../lib/asyncState';

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

jest.mock('../../../../hooks/lists/useRecordList', () => ({
	useRecordList: () => ({
		phase: AsyncStatePhase.REJECTED,
		items: [],
		itemCount: 0,
		error: { success: false, error: 'error-not-allowed', errorType: 'error-not-allowed' },
	}),
}));

describe('ThreadList Component', () => {
	it('should display an error message when in error state', async () => {
		render(<ThreadList />, {
			wrapper: mockAppRoot()
				.withRoom(fakeRoom)
				// @ts-expect-error this is a mock
				.withEndpoint('GET', '/v1/chat.getThreadsList', jest.fn)
				.wrap((children) => (
					<VirtuosoMockContext.Provider value={{ viewportHeight: 300, itemHeight: 100 }}>{children}</VirtuosoMockContext.Provider>
				))
				.build(),
		});
		expect(await screen.findByText('error-not-allowed')).toBeInTheDocument();
	});
});
