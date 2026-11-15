import { replyBroadcast } from './replyBroadcast';
import { createFakeMessage } from '../../../../tests/mocks/data';
import { router } from '../../../providers/RouterProvider';
import { roomCoordinator } from '../../rooms/roomCoordinator';
import type { ChatAPI } from '../ChatAPI';

jest.mock('../../rooms/roomCoordinator', () => ({
	roomCoordinator: {
		openRouteLink: jest.fn(),
	},
}));

jest.mock('../../../providers/RouterProvider', () => ({
	router: {
		getSearchParameters: jest.fn(),
	},
}));

const mockedOpenRouteLink = jest.mocked(roomCoordinator.openRouteLink);
const mockedGetSearchParameters = jest.mocked(router.getSearchParameters);

const messageAuthor = {
	_id: 'author-user-id',
	username: 'authoruser',
	name: 'Author User',
};

const message = createFakeMessage({
	_id: 'reply-message-id',
	u: messageAuthor,
});

afterEach(() => {
	jest.clearAllMocks();
});

describe('replyBroadcast', () => {
	it('should not carry over the msg search parameter when opening a direct message', async () => {
		mockedGetSearchParameters.mockReturnValue({
			msg: 'stale-message-id',
			layout: 'embedded',
		});

		await replyBroadcast({} as ChatAPI, message);

		expect(mockedGetSearchParameters).toHaveBeenCalled();
		expect(mockedOpenRouteLink).toHaveBeenCalledWith(
			'd',
			{ name: messageAuthor.username },
			{
				layout: 'embedded',
				reply: 'reply-message-id',
			},
		);

		const searchParams = mockedOpenRouteLink.mock.calls[0]?.[2];
		expect(searchParams).not.toHaveProperty('msg');
	});
});
