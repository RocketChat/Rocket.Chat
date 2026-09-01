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

const post = jest.mocked(sdk.rest.post);
const openRouteLink = jest.mocked(roomCoordinator.openRouteLink);
const getSearchParameters = jest.mocked(router.getSearchParameters);
const findSubscription = jest.mocked(Subscriptions.state.find);

const getCallback = () => {
	const { callback } = slashCommands.commands.open;
	expect(callback).toBeDefined();
	return callback as NonNullable<typeof callback>;
};

const runCommand = (params: string) =>
	getCallback()({
		command: 'open',
		params,
		message: { _id: 'message-id', rid: 'room-id' },
		userId: 'user-id',
	});

const setSubscriptions = (...subscriptions: ReturnType<typeof createFakeSubscription>[]) => {
	findSubscription.mockImplementation((predicate) => subscriptions.find(predicate));
};

describe('/open slash command', () => {
	beforeEach(() => {
		getSearchParameters.mockReturnValue({});
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	it.each([
		['channel', 'c', 'general'],
		['group', 'p', 'secret'],
	] as const)('opens the matching existing %s subscription', async (_kind, type, name) => {
		const wrongType = createFakeSubscription({ name, t: 'd' });
		const subscription = createFakeSubscription({ _id: 'subscription-id', rid: 'target-room-id', name, t: type });
		setSubscriptions(wrongType, subscription);

		await runCommand(`  #${name}  `);

		expect(openRouteLink).toHaveBeenCalledWith(type, subscription, {});
		expect(openRouteLink).toHaveBeenCalledTimes(1);
		expect(post).not.toHaveBeenCalled();
	});

	it('opens a matching existing subscription when the input has no prefix', async () => {
		const subscription = createFakeSubscription({ name: 'general', t: 'c' });
		setSubscriptions(subscription);

		await runCommand('general');

		expect(openRouteLink).toHaveBeenCalledWith('c', subscription, {});
		expect(post).not.toHaveBeenCalled();
	});

	it('forwards the current search parameters when opening a subscription', async () => {
		const subscription = createFakeSubscription({ name: 'general', t: 'c' });
		setSubscriptions(subscription);
		getSearchParameters.mockReturnValue({ layout: 'embedded' });

		await runCommand('#general');

		expect(openRouteLink).toHaveBeenCalledWith('c', subscription, { layout: 'embedded' });
	});

	it('uses the trimmed username from direct-message input', async () => {
		post.mockResolvedValue({} as never);

		await runCommand('  @alice  ');

		expect(post).toHaveBeenCalledWith('/v1/im.create', { username: 'alice' });
		expect(post).toHaveBeenCalledTimes(1);
	});

	it('opens an existing direct-message subscription', async () => {
		const subscription = createFakeSubscription({ name: 'alice', t: 'd' });
		setSubscriptions(subscription);
		post.mockResolvedValue({} as never);

		await runCommand('@alice');

		expect(openRouteLink).toHaveBeenCalledWith('d', subscription, {});
	});

	it('opens the direct-message subscription created by the REST API', async () => {
		const subscription = createFakeSubscription({ _id: 'subscription-id', rid: 'dm-room-id', name: 'alice', t: 'd' });
		findSubscription.mockReturnValueOnce(undefined).mockReturnValueOnce(subscription);
		post.mockResolvedValue({} as never);

		await runCommand('@alice');

		expect(post).toHaveBeenCalledWith('/v1/im.create', { username: 'alice' });
		expect(openRouteLink).toHaveBeenCalledWith('d', subscription, {});
		expect(post.mock.invocationCallOrder[0]).toBeLessThan(openRouteLink.mock.invocationCallOrder[0]);
	});

	it('does nothing when a channel or group subscription is missing', async () => {
		await expect(runCommand('#missing')).resolves.toBeUndefined();

		expect(post).not.toHaveBeenCalled();
		expect(openRouteLink).not.toHaveBeenCalled();
	});

	it('does not crash when the direct-message subscription is still missing after creation', async () => {
		post.mockResolvedValue({} as never);

		await expect(runCommand('@missing')).resolves.toBeUndefined();
		expect(post).toHaveBeenCalledWith('/v1/im.create', { username: 'missing' });
		expect(post).toHaveBeenCalledTimes(1);
		expect(openRouteLink).not.toHaveBeenCalled();
	});

	it('does not crash when direct-message creation fails', async () => {
		post.mockRejectedValue(new Error('Failed to create direct message'));

		await expect(runCommand('@alice')).resolves.toBeUndefined();
		expect(post).toHaveBeenCalledWith('/v1/im.create', { username: 'alice' });
		expect(post).toHaveBeenCalledTimes(1);
		expect(openRouteLink).not.toHaveBeenCalled();
	});
});
