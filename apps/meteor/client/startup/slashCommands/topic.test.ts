import { afterEach, beforeEach, describe, it, mock } from 'node:test';

import { expect } from 'expect';
import { ModuleMocker, mocked } from 'jest-mock';
import type { FunctionLike } from 'jest-mock';

import { createFakeRoom } from '../../../tests/mocks/data';

const mocker = new ModuleMocker(globalThis);
const fn: ModuleMocker['fn'] = mocker.fn.bind(mocker);
mock.module(require.resolve('@rocket.chat/ui-client'), {
	exports: {
		clientCallbacks: {
			run: fn<FunctionLike>(),
		},
	},
});
mock.module('../../lib/SDKClient', {
	exports: {
		sdk: {
			rest: {
				post: fn<FunctionLike>(),
			},
		},
	},
});
mock.module('../../lib/authorization', {
	exports: {
		hasPermission: fn<FunctionLike>(),
	},
});
mock.module('../../lib/toast', {
	exports: {
		dispatchToastMessage: fn<FunctionLike>(),
	},
});
mock.module('../../stores', {
	exports: {
		Rooms: {
			state: {
				get: fn<FunctionLike>(),
			},
		},
	},
});
const { clientCallbacks }: typeof import('@rocket.chat/ui-client') = require('@rocket.chat/ui-client');

const { sdk }: typeof import('../../lib/SDKClient') = require('../../lib/SDKClient');
const { hasPermission }: typeof import('../../lib/authorization') = require('../../lib/authorization');
const { slashCommands }: typeof import('../../lib/slashCommand') = require('../../lib/slashCommand');
const { dispatchToastMessage }: typeof import('../../lib/toast') = require('../../lib/toast');
const { Rooms }: typeof import('../../stores') = require('../../stores');

require('./topic');

const post = mocked(sdk.rest.post);
const checkPermission = mocked(hasPermission);
const runClientCallback = mocked(clientCallbacks.run);
const showToast = mocked(dispatchToastMessage);
const getRoom = mocked(Rooms.state.get);

const room = createFakeRoom({ _id: 'room-id', t: 'c', name: 'general' });

const getCallback = () => {
	const { callback } = slashCommands.commands.topic;
	expect(callback).toBeDefined();
	return callback as NonNullable<typeof callback>;
};

const runCommand = (params = 'New topic') =>
	getCallback()({
		command: 'topic',
		params,
		message: { _id: 'message-id', rid: 'room-id' },
		userId: 'user-id',
	});

describe('/topic slash command', () => {
	beforeEach(() => {
		checkPermission.mockReturnValue(true);
		post.mockResolvedValue({} as never);
		runClientCallback.mockResolvedValue(undefined);
		getRoom.mockReturnValue(room);
	});

	afterEach(() => {
		mocker.clearAllMocks();
	});

	it('updates the topic when the user has permission', async () => {
		await runCommand('Updated topic');

		expect(checkPermission).toHaveBeenCalledWith('edit-room', 'room-id');
		expect(post).toHaveBeenCalledWith('/v1/rooms.saveRoomSettings', {
			rid: 'room-id',
			roomTopic: 'Updated topic',
		});
	});

	it('does not call the API when permission is missing', async () => {
		checkPermission.mockReturnValue(false);

		await runCommand();

		expect(post).not.toHaveBeenCalled();
		expect(runClientCallback).not.toHaveBeenCalled();
		expect(getRoom).not.toHaveBeenCalled();
		expect(showToast).not.toHaveBeenCalled();
	});

	it('runs the roomTopicChanged callback after a successful update', async () => {
		await runCommand();

		expect(runClientCallback).toHaveBeenCalledWith('roomTopicChanged', room);
		expect(post.mock.invocationCallOrder[0]).toBeLessThan(runClientCallback.mock.invocationCallOrder[0]);
	});

	it('displays an error toast and propagates the REST API error when the update fails', async () => {
		const error = new Error('Failed to update topic');
		post.mockRejectedValue(error);

		await expect(runCommand()).rejects.toBe(error);
		expect(showToast).toHaveBeenCalledWith({ type: 'error', message: error });
		expect(runClientCallback).not.toHaveBeenCalled();
		expect(getRoom).not.toHaveBeenCalled();
	});
});
