import { Room, Upload } from '@rocket.chat/core-services';
import { federationSDK } from '@rocket.chat/federation-sdk';
import { Rooms, Subscriptions, Users } from '@rocket.chat/models';

import { member } from './member';

jest.mock('lodash.debounce', () => ({
	__esModule: true,
	default: (fn: (...args: unknown[]) => unknown) => fn,
}));

const onMembershipEvent = jest.fn();

jest.mock('@rocket.chat/federation-sdk', () => ({
	federationSDK: {
		eventEmitterService: {
			on: (...args: unknown[]) => onMembershipEvent(...args),
		},
		queryProfile: jest.fn(),
		downloadFromRemoteServer: jest.fn(),
		getConfig: jest.fn().mockReturnValue('local.server'),
	},
}));

jest.mock('@rocket.chat/models', () => ({
	Rooms: {
		findOneFederatedByMrid: jest.fn(),
	},
	Subscriptions: {
		findOneByRoomIdAndUserId: jest.fn(),
	},
	Users: {
		findOneByUsername: jest.fn(),
		setFederationAvatarUrlById: jest.fn(),
		setName: jest.fn(),
	},
}));

jest.mock('@rocket.chat/core-services', () => ({
	Room: {
		updateDirectMessageRoomName: jest.fn(),
		performAcceptRoomInvite: jest.fn(),
	},
	Upload: {
		setUserAvatar: jest.fn(),
		resetUserAvatar: jest.fn(),
	},
}));

describe('member avatar validation', () => {
	const queryProfileMock = federationSDK.queryProfile as jest.MockedFunction<typeof federationSDK.queryProfile>;
	const downloadFromRemoteServerMock = federationSDK.downloadFromRemoteServer as jest.MockedFunction<
		typeof federationSDK.downloadFromRemoteServer
	>;
	const findOneByUsernameMock = Users.findOneByUsername as jest.MockedFunction<typeof Users.findOneByUsername>;
	const setFederationAvatarUrlByIdMock = Users.setFederationAvatarUrlById as jest.MockedFunction<typeof Users.setFederationAvatarUrlById>;
	const findOneFederatedByMridMock = Rooms.findOneFederatedByMrid as jest.MockedFunction<typeof Rooms.findOneFederatedByMrid>;
	const findOneByRoomIdAndUserIdMock = Subscriptions.findOneByRoomIdAndUserId as jest.MockedFunction<
		typeof Subscriptions.findOneByRoomIdAndUserId
	>;
	const setUserAvatarMock = Upload.setUserAvatar as jest.MockedFunction<typeof Upload.setUserAvatar>;
	const resetUserAvatarMock = Upload.resetUserAvatar as jest.MockedFunction<typeof Upload.resetUserAvatar>;

	beforeEach(() => {
		jest.clearAllMocks();
		onMembershipEvent.mockClear();

		member();
	});

	function getHandler() {
		const [, handler] = onMembershipEvent.mock.calls[0];
		return handler as ({ event }: { event: any }) => Promise<void>;
	}

	async function emitJoinEvent({ avatarUrl }: { avatarUrl?: string | null }) {
		const handler = getHandler();

		const event = {
			room_id: '!room:remote.server',
			state_key: '@alice:remote.server',
			content: {
				membership: 'join',
				...(avatarUrl !== undefined ? { avatar_url: avatarUrl } : {}),
			},
		};

		await handler({ event });
	}

	it('skips avatar download when current remote avatar matches stored federation avatar URL', async () => {
		findOneByUsernameMock.mockResolvedValue({
			_id: 'u1',
			username: '@alice:remote.server',
			name: 'Alice',
			federation: { avatarUrl: 'mxc://remote.server/same' },
		} as any);
		findOneFederatedByMridMock.mockResolvedValue({ _id: 'r1', t: 'c' } as any);
		findOneByRoomIdAndUserIdMock.mockResolvedValue({ _id: 's1' } as any);
		queryProfileMock.mockResolvedValue({ avatar_url: 'mxc://remote.server/same' } as any);

		await emitJoinEvent({ avatarUrl: 'mxc://remote.server/old' });

		expect(downloadFromRemoteServerMock).not.toHaveBeenCalled();
		expect(setUserAvatarMock).not.toHaveBeenCalled();
		expect(resetUserAvatarMock).not.toHaveBeenCalled();
		expect(setFederationAvatarUrlByIdMock).not.toHaveBeenCalled();
	});

	it('downloads and stores avatar when current remote avatar changed', async () => {
		findOneByUsernameMock.mockResolvedValue({
			_id: 'u1',
			username: '@alice:remote.server',
			name: 'Alice',
			federation: { avatarUrl: 'mxc://remote.server/old' },
		} as any);
		findOneFederatedByMridMock.mockResolvedValue({ _id: 'r1', t: 'c' } as any);
		findOneByRoomIdAndUserIdMock.mockResolvedValue({ _id: 's1' } as any);
		queryProfileMock.mockResolvedValue({ avatar_url: 'mxc://remote.server/new' } as any);
		downloadFromRemoteServerMock.mockResolvedValue(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0]));

		await emitJoinEvent({ avatarUrl: 'mxc://remote.server/old' });

		expect(downloadFromRemoteServerMock).toHaveBeenCalledWith('remote.server', 'new');
		expect(setUserAvatarMock).toHaveBeenCalledTimes(1);
		expect(setFederationAvatarUrlByIdMock).toHaveBeenCalledWith('u1', 'mxc://remote.server/new');
	});

	it('falls back to event payload when profile query fails', async () => {
		findOneByUsernameMock.mockResolvedValue({
			_id: 'u1',
			username: '@alice:remote.server',
			name: 'Alice',
			federation: { avatarUrl: 'mxc://remote.server/old' },
		} as any);
		findOneFederatedByMridMock.mockResolvedValue({ _id: 'r1', t: 'c' } as any);
		findOneByRoomIdAndUserIdMock.mockResolvedValue({ _id: 's1' } as any);
		queryProfileMock.mockRejectedValue(new Error('profile unavailable'));
		downloadFromRemoteServerMock.mockResolvedValue(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0]));

		await emitJoinEvent({ avatarUrl: 'mxc://remote.server/fallback' });

		expect(downloadFromRemoteServerMock).toHaveBeenCalledWith('remote.server', 'fallback');
		expect(setFederationAvatarUrlByIdMock).toHaveBeenCalledWith('u1', 'mxc://remote.server/fallback');
	});

	it('does not treat missing avatar_url as removal when profile query fails', async () => {
		findOneByUsernameMock.mockResolvedValue({
			_id: 'u1',
			username: '@alice:remote.server',
			name: 'Alice',
			federation: { avatarUrl: 'mxc://remote.server/old' },
		} as any);
		findOneFederatedByMridMock.mockResolvedValue({ _id: 'r1', t: 'c' } as any);
		findOneByRoomIdAndUserIdMock.mockResolvedValue({ _id: 's1' } as any);
		queryProfileMock.mockRejectedValue(new Error('profile unavailable'));

		await emitJoinEvent({});

		expect(downloadFromRemoteServerMock).not.toHaveBeenCalled();
		expect(setUserAvatarMock).not.toHaveBeenCalled();
		expect(resetUserAvatarMock).not.toHaveBeenCalled();
		expect(setFederationAvatarUrlByIdMock).not.toHaveBeenCalled();
	});

	it('coalesces concurrent profile lookups for the same user', async () => {
		findOneByUsernameMock.mockResolvedValue({
			_id: 'u1',
			username: '@alice:remote.server',
			name: 'Alice',
			federation: { avatarUrl: 'mxc://remote.server/same' },
		} as any);
		findOneFederatedByMridMock.mockResolvedValue({ _id: 'r1', t: 'c' } as any);
		findOneByRoomIdAndUserIdMock.mockResolvedValue({ _id: 's1' } as any);

		let resolveProfile: ((value: { avatar_url: string }) => void) | undefined;
		const pendingProfile = new Promise<{ avatar_url: string }>((resolve) => {
			resolveProfile = resolve;
		});

		queryProfileMock.mockImplementation(() => pendingProfile as any);

		const firstJoin = emitJoinEvent({ avatarUrl: 'mxc://remote.server/old' });
		const secondJoin = emitJoinEvent({ avatarUrl: 'mxc://remote.server/old' });

		resolveProfile?.({ avatar_url: 'mxc://remote.server/same' });

		await Promise.all([firstJoin, secondJoin]);

		expect(queryProfileMock).toHaveBeenCalledTimes(1);
		expect(downloadFromRemoteServerMock).not.toHaveBeenCalled();
	});
});
