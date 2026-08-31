import { clientCallbacks } from '@rocket.chat/ui-client';

import { createFakeRoom } from '../../../tests/mocks/data';
import { sdk } from '../../lib/SDKClient';
import { hasPermission } from '../../lib/authorization';
import { slashCommands } from '../../lib/slashCommand';
import { dispatchToastMessage } from '../../lib/toast';
import { Rooms } from '../../stores';

import './topic';

jest.mock('@rocket.chat/ui-client', () => ({
	clientCallbacks: {
		run: jest.fn(),
	},
}));

jest.mock('../../lib/SDKClient', () => ({
	sdk: {
		rest: {
			post: jest.fn(),
		},
	},
}));

jest.mock('../../lib/authorization', () => ({
	hasPermission: jest.fn(),
}));

jest.mock('../../lib/toast', () => ({
	dispatchToastMessage: jest.fn(),
}));

jest.mock('../../stores', () => ({
	Rooms: {
		state: {
			get: jest.fn(),
		},
	},
}));

const { callback } = slashCommands.commands.topic;
const post = jest.mocked(sdk.rest.post);
const checkPermission = jest.mocked(hasPermission);
const runClientCallback = jest.mocked(clientCallbacks.run);
const showToast = jest.mocked(dispatchToastMessage);
const getRoom = jest.mocked(Rooms.state.get);

const callbackParams = (params = 'New topic') => ({
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
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('updates the topic when the user has permission', async () => {
		await callback?.(callbackParams('Updated topic'));

		expect(checkPermission).toHaveBeenCalledWith('edit-room', 'room-id');
		expect(post).toHaveBeenCalledWith('/v1/rooms.saveRoomSettings', {
			rid: 'room-id',
			roomTopic: 'Updated topic',
		});
	});

	it('does not call the API when permission is missing', async () => {
		checkPermission.mockReturnValue(false);

		await callback?.(callbackParams());

		expect(post).not.toHaveBeenCalled();
		expect(runClientCallback).not.toHaveBeenCalled();
	});

	it('runs the roomTopicChanged callback after a successful update', async () => {
		const room = createFakeRoom({ _id: 'room-id', t: 'c', name: 'general' });
		getRoom.mockReturnValue(room);

		await callback?.(callbackParams());

		expect(runClientCallback).toHaveBeenCalledWith('roomTopicChanged', room);
		expect(post.mock.invocationCallOrder[0]).toBeLessThan(runClientCallback.mock.invocationCallOrder[0]);
	});

	it('displays an error toast and propagates the error when the update fails', async () => {
		const error = new Error('Failed to update topic');
		post.mockRejectedValue(error);

		await expect(callback?.(callbackParams())).rejects.toBe(error);
		expect(showToast).toHaveBeenCalledWith({ type: 'error', message: error });
		expect(runClientCallback).not.toHaveBeenCalled();
	});
});
