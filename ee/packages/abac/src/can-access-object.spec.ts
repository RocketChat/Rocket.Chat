import { AbacAccessOperation, AbacObjectType } from '@rocket.chat/core-typings';

import { AbacService } from './index';

const mockSettingsGetValueById = jest.fn();
const mockSubscriptionsFindOneByRoomIdAndUserId = jest.fn();
const mockSubscriptionsSetAbacLastTimeCheckedByUserIdAndRoomId = jest.fn();
const mockUsersFindOne = jest.fn();
const mockUsersFindOneById = jest.fn();
const mockRoomRemoveUserFromRoom = jest.fn().mockResolvedValue(undefined);

jest.mock('@rocket.chat/models', () => ({
	Settings: {
		getValueById: (...args: any[]) => mockSettingsGetValueById(...args),
	},
	Subscriptions: {
		findOneByRoomIdAndUserId: (...args: any[]) => mockSubscriptionsFindOneByRoomIdAndUserId(...args),
		setAbacLastTimeCheckedByUserIdAndRoomId: (...args: any[]) => mockSubscriptionsSetAbacLastTimeCheckedByUserIdAndRoomId(...args),
	},
	Users: {
		findOne: (...args: any[]) => mockUsersFindOne(...args),
		findOneById: (...args: any[]) => mockUsersFindOneById(...args),
	},
	ServerEvents: {
		createAuditServerEvent: jest.fn(),
	},
}));

jest.mock('@rocket.chat/core-services', () => ({
	ServiceClass: class {},
	Room: {
		removeUserFromRoom: (...args: any[]) => mockRoomRemoveUserFromRoom(...args),
	},
}));

describe('AbacService.canAccessObject (unit)', () => {
	let service: AbacService;

	const baseRoom = {
		_id: 'RID',
		t: 'p',
		abacAttributes: [
			{ key: 'dept', values: ['eng', 'sales'] },
			{ key: 'region', values: ['emea'] },
		],
	};

	const baseUser = {
		_id: 'UID',
		username: 'user1',
	};

	beforeEach(() => {
		service = new AbacService();
		jest.clearAllMocks();
		// Default behaviors
		mockSettingsGetValueById.mockResolvedValue(300); // 5 minute cache
	});

	describe('parameter validation & early returns', () => {
		it('throws error-abac-unsupported-object-type when objectType is not ROOM', async () => {
			await expect(service.canAccessObject(baseRoom as any, baseUser as any, AbacAccessOperation.READ, 'not-room' as any)).rejects.toThrow(
				'error-abac-unsupported-object-type',
			);

			expect(mockSubscriptionsFindOneByRoomIdAndUserId).not.toHaveBeenCalled();
			expect(mockUsersFindOne).not.toHaveBeenCalled();
		});

		it('throws error-abac-unsupported-operation when action is not READ', async () => {
			await expect(
				service.canAccessObject(baseRoom as any, baseUser as any, AbacAccessOperation.WRITE, AbacObjectType.ROOM),
			).rejects.toThrow('error-abac-unsupported-operation');

			expect(mockSubscriptionsFindOneByRoomIdAndUserId).not.toHaveBeenCalled();
			expect(mockUsersFindOne).not.toHaveBeenCalled();
		});

		it('returns false when user is missing _id', async () => {
			const result = await service.canAccessObject(baseRoom as any, {} as any, AbacAccessOperation.READ, AbacObjectType.ROOM);
			expect(result).toBe(false);
			expect(mockSubscriptionsFindOneByRoomIdAndUserId).not.toHaveBeenCalled();
			expect(mockUsersFindOne).not.toHaveBeenCalled();
		});

		it('returns false when room has no abacAttributes array', async () => {
			const room = { ...baseRoom, abacAttributes: [] };
			const result = await service.canAccessObject(room as any, baseUser as any, AbacAccessOperation.READ, AbacObjectType.ROOM);
			expect(result).toBe(false);
			expect(mockSubscriptionsFindOneByRoomIdAndUserId).not.toHaveBeenCalled();
			expect(mockUsersFindOne).not.toHaveBeenCalled();
		});
	});

	describe('subscription presence & compliance evaluation', () => {
		it('returns false when user has no subscription to room', async () => {
			mockSubscriptionsFindOneByRoomIdAndUserId.mockResolvedValue(null);

			const result = await service.canAccessObject(baseRoom as any, baseUser as any, AbacAccessOperation.READ, AbacObjectType.ROOM);
			expect(result).toBe(false);
			expect(mockSubscriptionsFindOneByRoomIdAndUserId).toHaveBeenCalledWith(baseRoom._id, baseUser._id, {
				projection: { abacLastTimeChecked: 1 },
			});
			expect(mockUsersFindOne).not.toHaveBeenCalled();
		});

		it('returns false for non-compliant subscription and removes user from room when full user exists', async () => {
			mockSubscriptionsFindOneByRoomIdAndUserId.mockResolvedValue({
				_id: 'SUB',
				abacLastTimeChecked: undefined,
			});
			mockUsersFindOne.mockResolvedValue(null); // non-compliant
			mockUsersFindOneById.mockResolvedValue({ _id: baseUser._id, username: baseUser.username }); // full user for removal

			const result = await service.canAccessObject(baseRoom as any, baseUser as any, AbacAccessOperation.READ, AbacObjectType.ROOM);
			expect(result).toBe(false);

			// Compliance evaluation query assertions
			expect(mockUsersFindOne).toHaveBeenCalledTimes(1);
			const [query, options] = mockUsersFindOne.mock.calls[0];
			expect(query._id).toBe(baseUser._id);
			expect(Array.isArray(query.$and)).toBe(true);
			expect(query.$and).toHaveLength(baseRoom.abacAttributes.length);
			query.$and.forEach((cond: any, idx: number) => {
				expect(cond.abacAttributes.$elemMatch.key).toBe(baseRoom.abacAttributes[idx].key);
				expect(cond.abacAttributes.$elemMatch.values.$all).toEqual(baseRoom.abacAttributes[idx].values);
			});
			expect(options).toEqual({ projection: { _id: 1 } });

			// Removal path assertions
			expect(mockUsersFindOneById).toHaveBeenCalledWith(baseUser._id);
			expect(mockRoomRemoveUserFromRoom).toHaveBeenCalledWith(
				baseRoom._id,
				{ _id: baseUser._id, username: baseUser.username },
				{
					skipAppPreEvents: true,
					customSystemMessage: 'abac-removed-user-from-room',
				},
			);
			expect(mockSubscriptionsSetAbacLastTimeCheckedByUserIdAndRoomId).not.toHaveBeenCalled();
		});

		it('returns true and updates subscription timestamp when compliant', async () => {
			const fakeSub = { _id: 'SUB' };
			mockSubscriptionsFindOneByRoomIdAndUserId.mockResolvedValue(fakeSub);
			mockUsersFindOne.mockResolvedValue({ _id: baseUser._id });

			const result = await service.canAccessObject(baseRoom as any, baseUser as any, AbacAccessOperation.READ, AbacObjectType.ROOM);
			expect(result).toBe(true);

			expect(mockUsersFindOne).toHaveBeenCalledTimes(1);
			expect(mockSubscriptionsSetAbacLastTimeCheckedByUserIdAndRoomId).toHaveBeenCalledWith(baseUser._id, baseRoom._id, expect.any(Date));
		});
	});

	describe('decision cache behavior', () => {
		it('uses cached decision (returns true) when within cache TTL and subscription exists', async () => {
			const ttlSeconds = 120;
			mockSettingsGetValueById.mockResolvedValue(ttlSeconds);

			const within = new Date(Date.now() - (ttlSeconds * 1000 - 500)); // 500ms before expiry
			mockSubscriptionsFindOneByRoomIdAndUserId.mockResolvedValue({
				_id: 'SUB',
				abacLastTimeChecked: within,
			});

			const internalLogger = (service as any).logger;
			const loggerDebug = jest.spyOn(internalLogger, 'debug').mockImplementation(() => undefined);

			const result = await service.canAccessObject(baseRoom as any, baseUser as any, AbacAccessOperation.READ, AbacObjectType.ROOM);

			expect(result).toBe(true);
			expect(mockUsersFindOne).not.toHaveBeenCalled();
			expect(mockSubscriptionsSetAbacLastTimeCheckedByUserIdAndRoomId).not.toHaveBeenCalled();
			expect(loggerDebug).toHaveBeenCalledWith({
				msg: 'Using cached ABAC decision',
				userId: baseUser._id,
				roomId: baseRoom._id,
			});
		});

		it('re-evaluates when cache expired (timestamp older than TTL)', async () => {
			const ttlSeconds = 60;
			mockSettingsGetValueById.mockResolvedValue(ttlSeconds);

			const expired = new Date(Date.now() - (ttlSeconds * 1000 + 1000));
			mockSubscriptionsFindOneByRoomIdAndUserId.mockResolvedValue({
				_id: 'SUB',
				abacLastTimeChecked: expired,
			});
			mockUsersFindOne.mockResolvedValue({ _id: baseUser._id });

			const result = await service.canAccessObject(baseRoom as any, baseUser as any, AbacAccessOperation.READ, AbacObjectType.ROOM);

			expect(result).toBe(true);
			expect(mockUsersFindOne).toHaveBeenCalled();
			expect(mockSubscriptionsSetAbacLastTimeCheckedByUserIdAndRoomId).toHaveBeenCalled();
		});

		it('always evaluates when cache TTL is 0 (disabled)', async () => {
			mockSettingsGetValueById.mockResolvedValue(0);
			const recent = new Date(); // would be valid if TTL > 0
			mockSubscriptionsFindOneByRoomIdAndUserId.mockResolvedValue({
				_id: 'SUB',
				abacLastTimeChecked: recent,
			});
			mockUsersFindOne.mockResolvedValue({ _id: baseUser._id });

			const result = await service.canAccessObject(baseRoom as any, baseUser as any, AbacAccessOperation.READ, AbacObjectType.ROOM);

			expect(result).toBe(true);
			expect(mockUsersFindOne).toHaveBeenCalledTimes(1);
			expect(mockSubscriptionsSetAbacLastTimeCheckedByUserIdAndRoomId).toHaveBeenCalledTimes(1);
		});

		it('returns false (non-compliant) after cache expiry without updating lastTime', async () => {
			mockSettingsGetValueById.mockResolvedValue(10); // 10s TTL
			const expired = new Date(Date.now() - 15_000);
			mockSubscriptionsFindOneByRoomIdAndUserId.mockResolvedValue({
				_id: 'SUB',
				abacLastTimeChecked: expired,
			});
			mockUsersFindOne.mockResolvedValue(null); // not compliant
			mockUsersFindOneById.mockResolvedValue(null); // user not found path (no removal)

			const result = await service.canAccessObject(baseRoom as any, baseUser as any, AbacAccessOperation.READ, AbacObjectType.ROOM);
			expect(result).toBe(false);
			expect(mockUsersFindOne).toHaveBeenCalled();
			expect(mockUsersFindOneById).toHaveBeenCalledWith(baseUser._id);
			expect(mockRoomRemoveUserFromRoom).not.toHaveBeenCalled();
			expect(mockSubscriptionsSetAbacLastTimeCheckedByUserIdAndRoomId).not.toHaveBeenCalled();
		});
	});

	describe('query shape robustness', () => {
		it('builds $and conditions proportional to number of room attributes', async () => {
			mockSubscriptionsFindOneByRoomIdAndUserId.mockResolvedValue({ _id: 'SUB' });
			mockUsersFindOne.mockResolvedValue({ _id: baseUser._id });

			await service.canAccessObject(baseRoom as any, baseUser as any, AbacAccessOperation.READ, AbacObjectType.ROOM);

			const [query] = mockUsersFindOne.mock.calls[0];
			expect(Array.isArray(query.$and)).toBe(true);
			expect(query.$and).toHaveLength(baseRoom.abacAttributes.length);
			expect(baseRoom.abacAttributes[0]).toEqual({ key: 'dept', values: ['eng', 'sales'] });
		});

		it('handles single attribute room correctly', async () => {
			const singleAttrRoom = {
				...baseRoom,
				abacAttributes: [{ key: 'dept', values: ['eng'] }],
			};
			mockSubscriptionsFindOneByRoomIdAndUserId.mockResolvedValue({ _id: 'SUB' });
			mockUsersFindOne.mockResolvedValue({ _id: baseUser._id });

			await service.canAccessObject(singleAttrRoom as any, baseUser as any, AbacAccessOperation.READ, AbacObjectType.ROOM);

			const [query] = mockUsersFindOne.mock.calls[0];
			expect(query.$and).toHaveLength(1);
			expect(query.$and[0].abacAttributes.$elemMatch.key).toBe('dept');
			expect(query.$and[0].abacAttributes.$elemMatch.values.$all).toEqual(['eng']);
		});
	});
});
