import { createFakeSubscription } from '../../../tests/mocks/data';
import { sdk } from '../../lib/SDKClient';
import { roomCoordinator } from '../../lib/rooms/roomCoordinator';
import { slashCommands } from '../../lib/slashCommand';
import { router } from '../../providers/RouterProvider';
import { Subscriptions } from '../../stores';

import './open';

jest.mock('../../lib/SDKClient', () => ({
	sdk: {
		rest: {
			post: jest.fn(),
		},
	},
}));

jest.mock('../../lib/rooms/roomCoordinator', () => ({
	roomCoordinator: {
		openRouteLink: jest.fn(),
	},
}));

jest.mock('../../providers/RouterProvider', () => ({
	router: {
		getSearchParameters: jest.fn(),
	},
}));

jest.mock('../../stores', () => ({
	Subscriptions: {
		state: {
			find: jest.fn(),
		},
	},
}));

const { callback } = slashCommands.commands.open;
const post = jest.mocked(sdk.rest.post);
const openRouteLink = jest.mocked(roomCoordinator.openRouteLink);
const getSearchParameters = jest.mocked(router.getSearchParameters);
const findSubscription = jest.mocked(Subscriptions.state.find);

const callbackParams = (params: string) => ({
	command: 'open',
	params,
	message: { _id: 'message-id', rid: 'room-id' },
	userId: 'user-id',
});

describe('/open slash command', () => {
	beforeEach(() => {
		getSearchParameters.mockReturnValue({ layout: 'embedded' });
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	it.each([
		['channel', 'c'],
		['group', 'p'],
	] as const)('opens an existing %s subscription', async (_kind, type) => {
		const subscription = createFakeSubscription({ _id: 'subscription-id', rid: 'target-room-id', name: 'general', t: type });
		findSubscription.mockImplementation((predicate) => (predicate(subscription) ? subscription : undefined));

		await callback?.(callbackParams('  #general  '));

		expect(openRouteLink).toHaveBeenCalledWith(type, subscription, { layout: 'embedded' });
		expect(post).not.toHaveBeenCalled();
	});

	it('handles direct-message input', async () => {
		post.mockResolvedValue({} as never);

		await callback?.(callbackParams('  @alice  '));

		expect(post).toHaveBeenCalledWith('/v1/im.create', { username: 'alice' });
	});

	it('creates a direct-message subscription and opens the newly created subscription', async () => {
		const subscription = createFakeSubscription({ _id: 'subscription-id', rid: 'dm-room-id', name: 'alice', t: 'd' });
		findSubscription.mockReturnValueOnce(undefined).mockReturnValueOnce(subscription);
		post.mockResolvedValue({} as never);

		await callback?.(callbackParams('@alice'));

		expect(post).toHaveBeenCalledWith('/v1/im.create', { username: 'alice' });
		expect(openRouteLink).toHaveBeenCalledWith('d', subscription, { layout: 'embedded' });
	});

	it('does not crash when the direct-message subscription is still missing after creation', async () => {
		post.mockResolvedValue({} as never);

		await expect(callback?.(callbackParams('@missing'))).resolves.toBeUndefined();
		expect(openRouteLink).not.toHaveBeenCalled();
	});

	it('does not crash when direct-message creation fails', async () => {
		post.mockRejectedValue(new Error('Failed to create direct message'));

		await expect(callback?.(callbackParams('@alice'))).resolves.toBeUndefined();
		expect(openRouteLink).not.toHaveBeenCalled();
	});
});
