import { Room } from '@rocket.chat/core-services';
import type { IRoom, ISubscription, IUser } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import { Rooms, Subscriptions, Users } from '@rocket.chat/models';

import { member } from './member';

// Mock external dependencies
jest.mock('@rocket.chat/models', () => ({
	Rooms: {
		findOneFederatedByMrid: jest.fn(),
		findOne: jest.fn(),
	},
	Subscriptions: {
		findOneByRoomIdAndUserId: jest.fn(),
	},
	Users: {
		findOneByUsername: jest.fn(),
		setName: jest.fn(),
	},
}));

jest.mock('@rocket.chat/core-services', () => ({
	Room: {
		performUserRemoval: jest.fn(),
		performUserUnban: jest.fn(),
		updateDirectMessageRoomName: jest.fn(),
		performAcceptRoomInvite: jest.fn(),
		createUserSubscription: jest.fn(),
		create: jest.fn(),
	},
	Upload: {
		resetUserAvatar: jest.fn(),
		setUserAvatar: jest.fn(),
	},
}));

jest.mock('@rocket.chat/logger', () => ({
	Logger: jest.fn().mockImplementation(() => ({
		info: jest.fn(),
		debug: jest.fn(),
		warn: jest.fn(),
		error: jest.fn(),
	})),
}));

// Create a real emitter for our tests
const testEmitter = new Emitter();

jest.mock('@rocket.chat/federation-sdk', () => ({
	federationSDK: {
		eventEmitterService: {
			on: jest.fn((event: string, handler: (...args: any[]) => any) => {
				testEmitter.on(event, handler);
			}),
		},
		getConfig: jest.fn().mockReturnValue('rc.local'),
	},
}));

jest.mock('../helpers/createOrUpdateFederatedUser');
jest.mock('../helpers/extractDomainFromMatrixUserId', () => ({
	extractDomainFromMatrixUserId: jest.fn().mockReturnValue('remote.server'),
}));
jest.mock('../helpers/getUsernameServername', () => ({
	getUsernameServername: jest.fn().mockImplementation((mxid: string, _serverName: string) => {
		// For @user:rc.local -> local user
		if (mxid.includes('rc.local')) {
			const username = mxid.substring(1, mxid.indexOf(':'));
			return [username, 'rc.local', true];
		}
		// For remote users, return the full mxid
		return [mxid, 'remote.server', false];
	}),
}));
jest.mock('../services/MatrixMediaService');

const mockRooms = Rooms as jest.Mocked<typeof Rooms>;
const mockSubscriptions = Subscriptions as jest.Mocked<typeof Subscriptions>;
const mockUsers = Users as jest.Mocked<typeof Users>;
const mockRoom = Room as jest.Mocked<typeof Room>;

describe('federation member event: handleLeave', () => {
	const fakeRoom: IRoom = {
		_id: 'room1',
		t: 'p',
		name: 'test-room',
		federation: { mrid: '!room:remote.server', origin: 'remote.server', version: 1 },
		msgs: 0,
		usersCount: 2,
		u: { _id: 'admin', username: 'admin' },
		ts: new Date(),
		_updatedAt: new Date(),
	} as any;

	const fakeUser: IUser = {
		_id: 'user1',
		username: 'testuser',
		name: 'Test User',
		roles: ['user'],
		type: 'user',
	} as any;

	const fakeSenderUser: IUser = {
		_id: 'admin1',
		username: 'admin',
		name: 'Admin',
		roles: ['admin'],
		type: 'user',
	} as any;

	beforeAll(() => {
		// Register member event handlers
		member();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	function emitLeaveEvent(userId: string, senderId: string, roomId: string): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			testEmitter.emit('homeserver.matrix.membership', {
				event: {
					type: 'm.room.member',
					room_id: roomId,
					sender: senderId,
					state_key: userId,
					content: {
						membership: 'leave',
					},
					unsigned: {},
				},
			});
			// Give the async handler time to run
			setTimeout(resolve, 100);
		});
	}

	it('should unban user when subscription is BANNED on leave event', async () => {
		const bannedSubscription: Partial<ISubscription> = {
			_id: 'sub1',
			rid: 'room1',
			u: { _id: 'user1', username: 'testuser', name: 'Test User' },
			status: 'BANNED',
		};

		mockUsers.findOneByUsername.mockResolvedValueOnce(fakeUser).mockResolvedValueOnce(fakeSenderUser);
		(mockRooms.findOneFederatedByMrid as jest.Mock).mockResolvedValueOnce(fakeRoom);
		mockSubscriptions.findOneByRoomIdAndUserId.mockResolvedValueOnce(bannedSubscription as ISubscription);
		mockRoom.performUserUnban.mockResolvedValueOnce(undefined as any);

		await emitLeaveEvent('@testuser:rc.local', '@admin:rc.local', '!room:remote.server');

		expect(mockRoom.performUserUnban).toHaveBeenCalledWith(fakeRoom, fakeUser, fakeSenderUser);
		expect(mockRoom.performUserRemoval).not.toHaveBeenCalled();
	});

	it('should remove user when subscription exists and is NOT banned on leave event', async () => {
		const normalSubscription: Partial<ISubscription> = {
			_id: 'sub1',
			rid: 'room1',
			u: { _id: 'user1', username: 'testuser', name: 'Test User' },
			// no status field = normal active subscription
		};

		mockUsers.findOneByUsername.mockResolvedValueOnce(fakeUser).mockResolvedValueOnce(fakeSenderUser);
		(mockRooms.findOneFederatedByMrid as jest.Mock).mockResolvedValueOnce(fakeRoom);
		mockSubscriptions.findOneByRoomIdAndUserId.mockResolvedValueOnce(normalSubscription as ISubscription);
		mockRoom.performUserRemoval.mockResolvedValueOnce(undefined as any);

		await emitLeaveEvent('@testuser:rc.local', '@admin:rc.local', '!room:remote.server');

		expect(mockRoom.performUserRemoval).toHaveBeenCalledWith(fakeRoom, fakeUser);
		expect(mockRoom.performUserUnban).not.toHaveBeenCalled();
	});

	/**
	 * PRD-313: "Removed from Room" Error on Second Re-invite
	 *
	 * This test reproduces the scenario where a leave event from a previous unban
	 * arrives AFTER a new INVITED subscription has been created for the re-invite.
	 *
	 * The sequence is:
	 * 1. User is banned (subscription status = BANNED)
	 * 2. Admin re-invites user, which triggers unban + new invite:
	 *    - Banned subscription is removed
	 *    - Unban event sent to Matrix (kick/leave event)
	 *    - New invite sent to Matrix
	 *    - New INVITED subscription created locally
	 * 3. Matrix processes the unban and delivers the leave event back
	 * 4. handleLeave runs: finds the NEW INVITED subscription (not banned)
	 * 5. BUG: Falls through to performUserRemoval, deleting the INVITED subscription
	 * 6. User sees "You've been removed from room" error
	 *
	 * Expected: handleLeave should NOT remove a subscription in INVITED status
	 * when processing a leave event, because the leave event is stale (from the unban)
	 * and the user has already been re-invited.
	 */
	it('should NOT remove a user with INVITED subscription status on a leave event (PRD-313)', async () => {
		const invitedSubscription: Partial<ISubscription> = {
			_id: 'sub2',
			rid: 'room1',
			u: { _id: 'user1', username: 'testuser', name: 'Test User' },
			status: 'INVITED',
			inviter: { _id: 'admin1', username: 'admin', name: 'Admin' },
		};

		mockUsers.findOneByUsername.mockResolvedValueOnce(fakeUser).mockResolvedValueOnce(fakeSenderUser);
		(mockRooms.findOneFederatedByMrid as jest.Mock).mockResolvedValueOnce(fakeRoom);
		mockSubscriptions.findOneByRoomIdAndUserId.mockResolvedValueOnce(invitedSubscription as ISubscription);

		await emitLeaveEvent('@testuser:rc.local', '@admin:rc.local', '!room:remote.server');

		// The INVITED subscription must NOT be removed - it represents a valid pending invite
		expect(mockRoom.performUserRemoval).not.toHaveBeenCalled();
		// And it's not a banned subscription either
		expect(mockRoom.performUserUnban).not.toHaveBeenCalled();
	});
});
