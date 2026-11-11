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

const post = jest.mocked(sdk.rest.post);
const checkPermission = jest.mocked(hasPermission);
const runClientCallback = jest.mocked(clientCallbacks.run);
const showToast = jest.mocked(dispatchToastMessage);
const getRoom = jest.mocked(Rooms.state.get);

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
		jest.clearAllMocks();
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
