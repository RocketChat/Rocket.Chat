import type { IUser, IUserSessionConnection } from '@rocket.chat/core-typings';
import { UserStatus } from '@rocket.chat/core-typings';

import { processPresence } from './presenceEngine';

const ONE_HOUR = 3600_000;

type PresenceUser = Pick<IUser, 'statusDefault' | 'statusSource' | 'statusText' | 'statusExpiresAt' | 'previousState'>;

const user = (data: Partial<PresenceUser> = {}): PresenceUser => ({
	statusDefault: UserStatus.ONLINE,
	statusText: '',
	...data,
});

const session = (status: UserStatus = UserStatus.ONLINE): IUserSessionConnection => ({
	id: 'random',
	instanceId: 'random',
	status,
	_createdAt: new Date(),
	_updatedAt: new Date(),
});

describe('processPresence', () => {
	describe('baseline (no claim)', () => {
		test('should resolve to ONLINE when user has an active session', () => {
			const result = processPresence(user(), [session(UserStatus.ONLINE)]);
			expect(result.values).toMatchObject({ status: UserStatus.ONLINE, statusConnection: UserStatus.ONLINE });
		});

		test('should display BUSY when statusDefault is BUSY even if connection is ONLINE', () => {
			const result = processPresence(user({ statusDefault: UserStatus.BUSY }), [session(UserStatus.ONLINE)]);
			expect(result.values).toMatchObject({ status: UserStatus.BUSY, statusConnection: UserStatus.ONLINE });
		});

		test('should resolve to AWAY when user is idle', () => {
			const result = processPresence(user(), [session(UserStatus.AWAY)]);
			expect(result.values).toMatchObject({ status: UserStatus.AWAY, statusConnection: UserStatus.AWAY });
		});

		test('should resolve to OFFLINE when user has no sessions and no active claim', () => {
			const result = processPresence(user({ statusDefault: UserStatus.BUSY, statusText: 'Focusing' }), []);
			expect(result.values).toMatchObject({ status: UserStatus.OFFLINE, statusConnection: UserStatus.OFFLINE });
		});

		test('should stay OFFLINE when user is invisible (OFFLINE statusDefault with sessions)', () => {
			const result = processPresence(user({ statusDefault: UserStatus.OFFLINE }), [session(UserStatus.ONLINE)]);
			expect(result.values).toMatchObject({ status: UserStatus.OFFLINE, statusConnection: UserStatus.ONLINE });
		});
	});

	describe('session reduction', () => {
		test('should resolve to ONLINE when at least one session is active', () => {
			const result = processPresence(user(), [session(UserStatus.ONLINE), session(UserStatus.AWAY)]);
			expect(result.values).toMatchObject({ status: UserStatus.ONLINE, statusConnection: UserStatus.ONLINE });
		});

		test('should resolve to AWAY when all sessions are idle', () => {
			const result = processPresence(user(), [session(UserStatus.AWAY), session(UserStatus.AWAY)]);
			expect(result.values).toMatchObject({ status: UserStatus.AWAY, statusConnection: UserStatus.AWAY });
		});
	});

	describe('setActive', () => {
		test('should apply manual claim when user is online', () => {
			const result = processPresence(user(), [session()], {
				type: 'setActive',
				newState: { statusDefault: UserStatus.BUSY, statusSource: 'manual' },
			});
			expect(result.values.status).toBe(UserStatus.BUSY);
			expect(result.values.statusSource).toBe('manual');
		});

		test('should pass expiresAt when provided', () => {
			const exp = new Date(Date.now() + ONE_HOUR);
			const result = processPresence(user(), [session()], {
				type: 'setActive',
				newState: {
					statusDefault: UserStatus.BUSY,
					statusText: 'Out of office',
					statusSource: 'manual',
					statusExpiresAt: exp,
				},
			});
			expect(result.values.statusExpiresAt).toEqual(exp);
		});

		test('should save current as previousState when higher priority claim arrives', () => {
			const result = processPresence(
				user({ statusSource: 'manual', statusDefault: UserStatus.BUSY, statusText: 'Focusing' }),
				[session()],
				{ type: 'setActive', newState: { statusDefault: UserStatus.BUSY, statusText: 'On a call', statusSource: 'internal' } },
			);
			expect(result.values.statusSource).toBe('internal');
			expect(result.values.previousState).toMatchObject({ statusSource: 'manual', statusText: 'Focusing' });
		});

		test('should not save previousState when no existing claim', () => {
			const result = processPresence(user(), [session()], {
				type: 'setActive',
				newState: { statusDefault: UserStatus.BUSY, statusSource: 'manual' },
			});
			expect(result.values.previousState).toBeUndefined();
		});

		test('should overwrite when same priority claim arrives', () => {
			const result = processPresence(
				user({ statusSource: 'internal', statusDefault: UserStatus.BUSY, statusText: 'On a call' }),
				[session()],
				{ type: 'setActive', newState: { statusDefault: UserStatus.BUSY, statusText: 'In a meeting', statusSource: 'internal' } },
			);
			expect(result.values.statusText).toBe('In a meeting');
			expect(result.values.statusSource).toBe('internal');
		});

		test('should queue lower priority claim as previousState', () => {
			const result = processPresence(
				user({ statusSource: 'internal', statusDefault: UserStatus.BUSY, statusText: 'On a call' }),
				[session()],
				{ type: 'setActive', newState: { statusDefault: UserStatus.AWAY, statusText: 'Lunch', statusSource: 'manual' } },
			);
			expect(result.values.previousState).toMatchObject({ statusDefault: UserStatus.AWAY, statusText: 'Lunch', statusSource: 'manual' });
			expect(result.values.statusSource).toBeUndefined();
		});

		test('should replace expired previousState with lower priority claim', () => {
			const result = processPresence(
				user({
					statusSource: 'internal',
					statusDefault: UserStatus.BUSY,
					previousState: {
						statusDefault: UserStatus.BUSY,
						statusText: 'Old',
						statusSource: 'external',
						statusExpiresAt: new Date(Date.now() - ONE_HOUR),
					},
				}),
				[session()],
				{ type: 'setActive', newState: { statusDefault: UserStatus.BUSY, statusText: 'Deep work', statusSource: 'manual' } },
			);
			expect(result.values.previousState).toMatchObject({
				statusDefault: UserStatus.BUSY,
				statusText: 'Deep work',
				statusSource: 'manual',
			});
		});

		test('should discard lower priority claim when previousState has higher priority', () => {
			const result = processPresence(
				user({
					statusSource: 'internal',
					statusDefault: UserStatus.BUSY,
					previousState: {
						statusDefault: UserStatus.BUSY,
						statusText: 'Deep work',
						statusSource: 'manual',
						statusExpiresAt: new Date(Date.now() + ONE_HOUR),
					},
				}),
				[session()],
				{ type: 'setActive', newState: { statusDefault: UserStatus.BUSY, statusText: 'Standup', statusSource: 'external' } },
			);
			expect(result.values).toStrictEqual({});
		});

		test('should apply manual over external without stashing the displaced claim', () => {
			const result = processPresence(
				user({ statusSource: 'external', statusDefault: UserStatus.BUSY, statusText: 'In a meeting' }),
				[session()],
				{ type: 'setActive', newState: { statusDefault: UserStatus.BUSY, statusText: 'Focusing', statusSource: 'manual' } },
			);
			expect(result.values.statusSource).toBe('manual');
			expect(result.values.statusText).toBe('Focusing');
			expect(result.values.previousState).toBeUndefined();
			expect(result.clear).toContain('previousState');
		});

		test('should drop a queued previousState when a manual claim wins', () => {
			const result = processPresence(
				user({
					statusSource: 'external',
					statusDefault: UserStatus.BUSY,
					statusText: 'In a meeting',
					previousState: { statusDefault: UserStatus.AWAY, statusText: 'Lunch', statusSource: 'manual' },
				}),
				[session()],
				{ type: 'setActive', newState: { statusDefault: UserStatus.BUSY, statusText: 'Focusing', statusSource: 'manual' } },
			);
			expect(result.values.statusSource).toBe('manual');
			expect(result.values.previousState).toBeUndefined();
			expect(result.clear).toContain('previousState');
		});

		test('should clear a queued previousState when overwriting a same-source manual claim', () => {
			const result = processPresence(
				user({
					statusSource: 'manual',
					statusDefault: UserStatus.BUSY,
					statusText: 'Focusing',
					previousState: { statusDefault: UserStatus.AWAY, statusText: 'Lunch', statusSource: 'external' },
				}),
				[session()],
				{ type: 'setActive', newState: { statusDefault: UserStatus.AWAY, statusText: 'Heads down', statusSource: 'manual' } },
			);
			expect(result.values.statusText).toBe('Heads down');
			expect(result.clear).toContain('previousState');
		});
	});

	describe('endActive', () => {
		test('should reset to ONLINE when no previousState exists', () => {
			const result = processPresence(
				user({ statusSource: 'manual', statusDefault: UserStatus.BUSY, statusText: 'Design work' }),
				[session()],
				{ type: 'endActive' },
			);
			expect(result.values).toMatchObject({ statusDefault: UserStatus.ONLINE });
			expect(result.clear).toEqual(expect.arrayContaining(['statusSource', 'statusExpiresAt', 'previousState']));
		});

		test('should restore previousState when valid', () => {
			const result = processPresence(
				user({
					statusSource: 'internal',
					statusDefault: UserStatus.BUSY,
					previousState: { statusDefault: UserStatus.BUSY, statusText: 'Focusing', statusSource: 'manual' },
				}),
				[session()],
				{ type: 'endActive' },
			);
			expect(result.values).toMatchObject({ statusSource: 'manual', statusText: 'Focusing' });
			expect(result.clear).toContain('previousState');
		});

		test('should reset to ONLINE when previousState is expired', () => {
			const result = processPresence(
				user({
					statusSource: 'internal',
					statusDefault: UserStatus.BUSY,
					previousState: {
						statusDefault: UserStatus.BUSY,
						statusText: 'Focus',
						statusSource: 'manual',
						statusExpiresAt: new Date(Date.now() - 600_000),
					},
				}),
				[session()],
				{ type: 'endActive' },
			);
			expect(result.values).toMatchObject({ statusDefault: UserStatus.ONLINE });
			expect(result.clear).toContain('previousState');
		});

		test('should restore previousState with expiresAt', () => {
			const exp = new Date(Date.now() + ONE_HOUR);
			const result = processPresence(
				user({
					statusSource: 'internal',
					statusDefault: UserStatus.BUSY,
					previousState: {
						statusDefault: UserStatus.BUSY,
						statusText: 'Standup',
						statusSource: 'external',
						statusExpiresAt: exp,
					},
				}),
				[session()],
				{ type: 'endActive' },
			);
			expect(result.values).toMatchObject({ statusSource: 'external', statusExpiresAt: exp });
			expect(result.clear).toContain('previousState');
		});
	});

	describe('clearActive', () => {
		test('should reset to ONLINE and clear all claim fields', () => {
			const result = processPresence(user({ statusSource: 'manual', statusDefault: UserStatus.BUSY }), [session()], {
				type: 'clearActive',
			});
			expect(result.values).toMatchObject({ statusDefault: UserStatus.ONLINE, statusText: '', status: UserStatus.ONLINE });
			expect(result.clear).toEqual(expect.arrayContaining(['statusSource', 'statusExpiresAt', 'previousState']));
		});

		test('should defer to connection when statusDefault resets to ONLINE', () => {
			const result = processPresence(user({ statusDefault: UserStatus.BUSY, statusSource: 'manual' }), [session(UserStatus.AWAY)], {
				type: 'clearActive',
			});
			expect(result.values.status).toBe(UserStatus.AWAY);
			expect(result.values.statusDefault).toBe(UserStatus.ONLINE);
		});
	});

	describe('offline users', () => {
		test('should reject non-manual claim when user is offline', () => {
			const result = processPresence(user({ statusDefault: UserStatus.OFFLINE }), [], {
				type: 'setActive',
				newState: { statusDefault: UserStatus.BUSY, statusSource: 'external' },
			});
			expect(result.values).toStrictEqual({});
		});

		test('should accept manual claim when user is offline', () => {
			const result = processPresence(user({ statusDefault: UserStatus.OFFLINE }), [], {
				type: 'setActive',
				newState: { statusDefault: UserStatus.BUSY, statusSource: 'manual', statusText: 'Working' },
			});
			expect(result.values.statusSource).toBe('manual');
			// display status is OFFLINE because there is no active connection;
			// statusDefault (BUSY) is persisted and will take effect on reconnect
			expect(result.values.status).toBe(UserStatus.OFFLINE);
			expect(result.values.statusConnection).toBe(UserStatus.OFFLINE);
		});
	});

	describe('fieldsToUnset', () => {
		test('should unset expiresAt when absent from new claim', () => {
			const result = processPresence(user({ statusExpiresAt: new Date() }), [session()], {
				type: 'setActive',
				newState: { statusDefault: UserStatus.BUSY, statusText: 'Focus', statusSource: 'manual' },
			});
			expect(result.clear).toContain('statusExpiresAt');
		});
	});

	describe('computeStatus', () => {
		test('should resolve to OFFLINE when session is OFFLINE regardless of claim', () => {
			const result = processPresence(user(), [session(UserStatus.OFFLINE)], {
				type: 'setActive',
				newState: { statusDefault: UserStatus.BUSY, statusSource: 'manual' },
			});
			expect(result.values.status).toBe(UserStatus.OFFLINE);
		});
	});
});
