import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import { VirtuosoMockContext } from 'react-virtuoso';

import ThreadList from './ThreadList';
import { createFakeRoom, createFakeSubscription } from '../../../../../tests/mocks/data';

const fakeRoom = createFakeRoom({ t: 'c' });
const subscription = createFakeSubscription({ rid: fakeRoom._id, tunread: ['thread-id'] });

jest.mock('../../../../../rocketchat.info', () => ({ Info: {} }));
jest.mock('../../contexts/RoomContext', () => ({
	useRoom: () => fakeRoom,
	useRoomSubscription: () => subscription,
}));
jest.mock('../../../../lib/rooms/roomCoordinator', () => ({ roomCoordinator: { isLivechatRoom: () => false } }));
jest.mock('../../../../lib/e2ee/rocketchat.e2e', () => ({ e2e: { decryptMessage: jest.fn() } }));
jest.mock('../../../../lib/utils/fireGlobalEvent', () => ({ fireGlobalEvent: () => undefined }));
jest.mock('../../../../../lib/i18n', () => ({ t: (key: string) => key }));

const thread = {
	_id: 'thread-id',
	rid: fakeRoom._id,
	msg: 'say alpha to @alice',
	ts: '2021-10-27T00:00:00.000Z',
	_updatedAt: '2021-10-27T00:00:00.000Z',
	tlm: '2021-10-28T00:00:00.000Z',
	tcount: 2,
	replies: ['someone-else'],
	u: { _id: 'author', username: 'author', name: 'Author' },
	mentions: [{ _id: 'alice-id', username: 'alice', name: 'Alice A', type: 'user' }],
};

const renderThreadList = (root = mockAppRoot()) =>
	render(<ThreadList />, {
		wrapper: root
			.withJohnDoe()
			.withRoom(fakeRoom)
			.withEndpoint('GET', '/v1/chat.getThreadsList', jest.fn().mockResolvedValue({ threads: [thread], total: 1 }))
			.wrap((children) => (
				<VirtuosoMockContext.Provider value={{ viewportHeight: 300, itemHeight: 100 }}>{children}</VirtuosoMockContext.Provider>
			))
			.build(),
	});

it('highlights the words the viewer highlights in a preview (R36)', async () => {
	renderThreadList(mockAppRoot().withUserPreference('highlights', ['alpha']));

	expect(await screen.findByTitle('Highlighted_chosen_word')).toHaveTextContent('alpha');
});

it('shows a preview without resolving its mentions (R39)', async () => {
	renderThreadList(mockAppRoot().withSetting('UI_Use_Real_Name', true));

	expect(await screen.findByText(/say alpha to/)).toBeInTheDocument();
	expect(screen.queryByText('Alice A')).not.toBeInTheDocument();
});

it('names the follow button by the followed state alone while the badge shows what is unread (R39)', async () => {
	renderThreadList();

	expect(await screen.findByRole('button', { name: 'Not_following' })).toBeInTheDocument();
	expect(screen.getByRole('status', { name: 'Unread' })).toBeInTheDocument();
});
