import { afterEach, beforeEach, describe, it, mock } from 'node:test';

import { expect } from 'expect';
import { ModuleMocker, mocked } from 'jest-mock';
import type { FunctionLike } from 'jest-mock';

import { createFakeSubscription } from '../../../tests/mocks/data';

const mocker = new ModuleMocker(globalThis);
const fn: ModuleMocker['fn'] = mocker.fn.bind(mocker);
mock.module('../../lib/SDKClient', {
	exports: {
		sdk: {
			rest: {
				post: fn<FunctionLike>(),
			},
		},
	},
});
mock.module('../../lib/rooms/roomCoordinator', {
	exports: {
		roomCoordinator: {
			openRouteLink: fn<FunctionLike>(),
		},
	},
});
mock.module('../../providers/RouterProvider', {
	exports: {
		router: {
			getSearchParameters: fn<FunctionLike>(),
		},
	},
});
mock.module('../../stores', {
	exports: {
		Subscriptions: {
			state: {
				find: fn<FunctionLike>(),
			},
		},
	},
});
const { sdk }: typeof import('../../lib/SDKClient') = require('../../lib/SDKClient');
const { roomCoordinator }: typeof import('../../lib/rooms/roomCoordinator') = require('../../lib/rooms/roomCoordinator');
const { slashCommands }: typeof import('../../lib/slashCommand') = require('../../lib/slashCommand');
const { router }: typeof import('../../providers/RouterProvider') = require('../../providers/RouterProvider');
const { Subscriptions }: typeof import('../../stores') = require('../../stores');

require('./open');

const post = mocked(sdk.rest.post);
const openRouteLink = mocked(roomCoordinator.openRouteLink);
const getSearchParameters = mocked(router.getSearchParameters);
const findSubscription = mocked(Subscriptions.state.find);

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
		mocker.resetAllMocks();
	});

	(
		[
			['channel', 'c', 'general'],
			['group', 'p', 'secret'],
		] as const
	).forEach(([_kind, type, name]) => {
		it(`opens the matching existing ${_kind} subscription`, async () => {
			const wrongType = createFakeSubscription({ name, t: 'd' });
			const subscription = createFakeSubscription({ _id: 'subscription-id', rid: 'target-room-id', name, t: type });
			setSubscriptions(wrongType, subscription);

			await runCommand(`  #${name}  `);

			expect(openRouteLink).toHaveBeenCalledWith(type, subscription, {});
			expect(openRouteLink).toHaveBeenCalledTimes(1);
			expect(post).not.toHaveBeenCalled();
		});
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
