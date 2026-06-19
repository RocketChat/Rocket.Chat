import type { IUser, IUserSessionConnection } from '@rocket.chat/core-typings';
import { UserStatus } from '@rocket.chat/core-typings';

import { processPresence } from './presenceEngine';

const ONE_HOUR = 3600_000;

type PresenceUser = Pick<
	IUser,
	'type' | 'roles' | 'statusDefault' | 'statusSource' | 'statusText' | 'statusExpiresAt' | 'statusId' | 'previousState'
>;

const user = (data: Partial<PresenceUser> = {}): PresenceUser => ({
	statusDefault: UserStatus.ONLINE,
	statusText: '',
	...data,
});

const bot = (data: Partial<PresenceUser> = {}): PresenceUser => user({ type: 'bot', ...data });

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

	describe('auto-away over an existing claim (claimless recompute)', () => {
		test('a manual online claim still goes AWAY on idle, without touching the claim or statusText', () => {
			const result = processPresence(user({ statusSource: 'manual', statusDefault: UserStatus.ONLINE, statusText: 'Working' }), [
				session(UserStatus.AWAY),
			]);

			expect(result.values).toMatchObject({ status: UserStatus.AWAY, statusConnection: UserStatus.AWAY });
			expect(result.values).not.toHaveProperty('statusText');
			expect(result.values).not.toHaveProperty('statusSource');
			expect(result.values).not.toHaveProperty('statusDefault');
			expect(result.clear).toBeUndefined();
		});

		test('a manual busy claim stays BUSY on idle (auto-away suppressed), claim preserved', () => {
			const result = processPresence(user({ statusSource: 'manual', statusDefault: UserStatus.BUSY, statusText: 'Focusing' }), [
				session(UserStatus.AWAY),
			]);

			expect(result.values).toMatchObject({ status: UserStatus.BUSY, statusConnection: UserStatus.AWAY });
			expect(result.values).not.toHaveProperty('statusText');
			expect(result.values).not.toHaveProperty('statusSource');
			expect(result.clear).toBeUndefined();
		});

		test('when the user becomes active again the manual online claim resolves back to ONLINE', () => {
			const result = processPresence(user({ statusSource: 'manual', statusDefault: UserStatus.ONLINE, statusText: 'Working' }), [
				session(UserStatus.ONLINE),
			]);

			expect(result.values).toMatchObject({ status: UserStatus.ONLINE, statusConnection: UserStatus.ONLINE });
			expect(result.values).not.toHaveProperty('statusText');
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

		test('should display the new claim and save the displaced one as previousState on same priority', () => {
			const result = processPresence(
				user({ statusSource: 'internal', statusDefault: UserStatus.BUSY, statusText: 'On a call' }),
				[session()],
				{ type: 'setActive', newState: { statusDefault: UserStatus.BUSY, statusText: 'In a meeting', statusSource: 'internal' } },
			);
			expect(result.values.statusText).toBe('In a meeting');
			expect(result.values.statusSource).toBe('internal');
			expect(result.values.previousState).toMatchObject({ statusSource: 'internal', statusText: 'On a call' });
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

		test('should update a same-source external claim in place without stashing it (calendar re-apply)', () => {
			const oldExp = new Date(Date.now() + ONE_HOUR);
			const newExp = new Date(Date.now() + 2 * ONE_HOUR);
			const result = processPresence(
				user({ statusSource: 'external', statusDefault: UserStatus.BUSY, statusText: 'In a meeting', statusExpiresAt: oldExp }),
				[session()],
				{
					type: 'setActive',
					newState: { statusDefault: UserStatus.BUSY, statusText: 'In a meeting', statusSource: 'external', statusExpiresAt: newExp },
				},
			);
			expect(result.values.statusExpiresAt).toEqual(newExp);
			expect(result.values.previousState).toBeUndefined();
		});

		test('should still stash a same-source internal claim (voice + video stack)', () => {
			const result = processPresence(
				user({ statusSource: 'internal', statusDefault: UserStatus.BUSY, statusText: 'On a call' }),
				[session()],
				{ type: 'setActive', newState: { statusDefault: UserStatus.BUSY, statusText: 'In a meeting', statusSource: 'internal' } },
			);
			expect(result.values.previousState).toMatchObject({ statusSource: 'internal', statusText: 'On a call' });
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

	describe('endActive with statusId (claim identity)', () => {
		test('should drop the stash and keep displaying when the stashed claim ends (older-first)', () => {
			const result = processPresence(
				user({
					statusSource: 'internal',
					statusDefault: UserStatus.BUSY,
					statusText: 'In a meeting',
					statusId: 'confB',
					previousState: { statusDefault: UserStatus.BUSY, statusText: 'On a call', statusSource: 'internal', statusId: 'callA' },
				}),
				[session()],
				{ type: 'endActive', statusId: 'callA' },
			);
			expect(result.values.statusText).toBeUndefined();
			expect(result.values.statusSource).toBeUndefined();
			expect(result.values.status).toBe(UserStatus.BUSY);
			expect(result.clear).toContain('previousState');
		});

		test('should restore the stashed claim with its statusId when the active claim ends (newest-first)', () => {
			const result = processPresence(
				user({
					statusSource: 'internal',
					statusDefault: UserStatus.BUSY,
					statusText: 'In a meeting',
					statusId: 'confB',
					previousState: { statusDefault: UserStatus.BUSY, statusText: 'On a call', statusSource: 'internal', statusId: 'callA' },
				}),
				[session()],
				{ type: 'endActive', statusId: 'confB' },
			);
			expect(result.values).toMatchObject({ statusSource: 'internal', statusText: 'On a call', statusId: 'callA' });
			expect(result.clear).toContain('previousState');
		});

		test('should no-op when the statusId matches neither the active nor the stashed claim', () => {
			const result = processPresence(
				user({
					statusSource: 'internal',
					statusDefault: UserStatus.BUSY,
					statusText: 'In a meeting',
					statusId: 'confB',
					previousState: { statusDefault: UserStatus.BUSY, statusText: 'On a call', statusSource: 'internal', statusId: 'callA' },
				}),
				[session()],
				{ type: 'endActive', statusId: 'unknown' },
			);
			expect(result.values).toStrictEqual({});
		});

		test('should reset to ONLINE when the active claim ends and there is no stash', () => {
			const result = processPresence(
				user({ statusSource: 'internal', statusDefault: UserStatus.BUSY, statusText: 'On a call', statusId: 'callA' }),
				[session()],
				{ type: 'endActive', statusId: 'callA' },
			);
			expect(result.values).toMatchObject({ statusDefault: UserStatus.ONLINE });
			expect(result.clear).toEqual(expect.arrayContaining(['statusSource', 'statusExpiresAt', 'previousState', 'statusId']));
		});
	});

	describe('setActive with statusId (claim identity)', () => {
		test('should store the statusId on a new claim', () => {
			const result = processPresence(user(), [session()], {
				type: 'setActive',
				newState: { statusDefault: UserStatus.BUSY, statusText: 'On a call', statusSource: 'internal', statusId: 'callA' },
			});
			expect(result.values).toMatchObject({ statusSource: 'internal', statusId: 'callA' });
		});

		test('should stash the displaced claim with its statusId and store the new id (voice + video)', () => {
			const result = processPresence(
				user({ statusSource: 'internal', statusDefault: UserStatus.BUSY, statusText: 'On a call', statusId: 'callA' }),
				[session()],
				{
					type: 'setActive',
					newState: { statusDefault: UserStatus.BUSY, statusText: 'In a meeting', statusSource: 'internal', statusId: 'confB' },
				},
			);
			expect(result.values).toMatchObject({ statusText: 'In a meeting', statusId: 'confB' });
			expect(result.values.previousState).toMatchObject({ statusText: 'On a call', statusId: 'callA' });
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

	describe('no connection - humans (connection-bound)', () => {
		test('clearActive: explicit "set online" is honored (stays online)', () => {
			const result = processPresence(user({ statusSource: 'manual', statusDefault: UserStatus.BUSY }), [], { type: 'clearActive' });
			expect(result.values.status).toBe(UserStatus.ONLINE);
		});

		test('setActive: busy claim is persisted but display is OFFLINE', () => {
			const result = processPresence(user(), [], {
				type: 'setActive',
				newState: { statusDefault: UserStatus.BUSY, statusSource: 'manual', statusText: 'Focus' },
			});
			expect(result.values.status).toBe(UserStatus.OFFLINE);
			expect(result.values.statusDefault).toBe(UserStatus.BUSY); // claim persisted for reconnect
		});

		test('endActive: ending a claim reverts to connection reality (OFFLINE), not statusDefault', () => {
			const result = processPresence(user({ statusSource: 'manual', statusDefault: UserStatus.BUSY }), [], { type: 'endActive' });
			expect(result.values.status).toBe(UserStatus.OFFLINE);
		});
	});

	describe('no connection - service users (bots/apps) hold their declared status', () => {
		test.each([
			['type "bot"', bot(), UserStatus.BUSY, 'manual' as const],
			['type "app"', user({ type: 'app' }), UserStatus.AWAY, 'external' as const],
			['role "bot" (type "user")', user({ type: 'user', roles: ['bot'] }), UserStatus.BUSY, 'manual' as const],
		])('setActive: a service user (%s) displays its declared status, not OFFLINE', (_label, serviceUser, statusDefault, statusSource) => {
			const result = processPresence(serviceUser, [], {
				type: 'setActive',
				newState: { statusDefault, statusSource },
			});
			expect(result.values.status).toBe(statusDefault);
		});

		test('endActive: a bot whose claim is released reverts to OFFLINE (re-assert to restore)', () => {
			const result = processPresence(bot({ statusSource: 'manual', statusDefault: UserStatus.BUSY }), [], { type: 'endActive' });
			expect(result.values.status).toBe(UserStatus.OFFLINE);
		});
	});
});
