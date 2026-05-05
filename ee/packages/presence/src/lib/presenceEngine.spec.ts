import { type IUser, UserStatus } from '@rocket.chat/core-typings';

import { setActive, endActive, clearActive } from './presenceEngine';

const ONE_HOUR = 3600_000;

const user = (o: Partial<IUser> = {}): IUser =>
	({
		_id: 'user-id-01',
		username: 'testuser',
		roles: ['user'],
		status: UserStatus.ONLINE,
		statusDefault: UserStatus.ONLINE,
		statusConnection: UserStatus.ONLINE,
		statusText: '',
		...o,
	}) as IUser;

const invisibleUser = (o: Partial<IUser> = {}) => user({ statusDefault: UserStatus.OFFLINE, statusConnection: UserStatus.ONLINE, ...o });

describe('presenceEngine', () => {
	describe('setActive', () => {
		describe('when a higher-priority source arrives', () => {
			it('should save current as previous and apply new', () => {
				const result = setActive(user({ statusDefault: UserStatus.BUSY, statusText: 'Standup', statusSource: 'external' }), {
					statusDefault: UserStatus.BUSY,
					statusText: 'Deep work',
					statusSource: 'manual',
					statusEmoji: '🔒',
				});

				expect(result?.values.statusSource).toBe('manual');
				expect(result?.values.statusText).toBe('Deep work');
				expect(result?.values.previousState).toMatchObject({ statusSource: 'external', statusText: 'Standup' });
			});

			it('should not save previous when there is no active claim', () => {
				const result = setActive(user(), { statusDefault: UserStatus.BUSY, statusText: 'Deep work', statusSource: 'manual' });

				expect(result?.values.statusSource).toBe('manual');
				expect(result?.values.statusText).toBe('Deep work');
				expect(result?.values.previousState).toBeUndefined();
			});
		});

		describe('when a same-priority source arrives', () => {
			it('should overwrite active and keep previous intact', () => {
				const result = setActive(
					user({
						statusSource: 'external',
						statusText: 'Standup',
						statusDefault: UserStatus.BUSY,
						previousState: { statusDefault: UserStatus.BUSY, statusText: 'Deep work', statusSource: 'manual' },
					}),
					{ statusDefault: UserStatus.BUSY, statusText: '1:1', statusSource: 'external' },
				);

				expect(result?.values.statusSource).toBe('external');
				expect(result?.values.statusText).toBe('1:1');
				expect(result?.values.previousState).toBeUndefined();
			});

			it('should overwrite regardless of expiration', () => {
				const shortExpiry = new Date(Date.now() + 30 * 60_000);
				const result = setActive(
					user({
						statusSource: 'external',
						statusText: 'Conference',
						statusDefault: UserStatus.BUSY,
						statusExpiresAt: new Date(Date.now() + 5 * ONE_HOUR),
					}),
					{ statusDefault: UserStatus.BUSY, statusText: '1:1', statusSource: 'external', statusExpiresAt: shortExpiry },
				);

				expect(result?.values.statusText).toBe('1:1');
				expect(result?.values.statusExpiresAt).toEqual(shortExpiry);
			});
		});

		describe('when a lower-priority source arrives', () => {
			it('should save as previous when slot is empty (no visible change)', () => {
				const newState = { statusDefault: UserStatus.BUSY, statusText: 'Standup', statusSource: 'external' as const };
				const result = setActive(user({ statusSource: 'manual', statusText: 'Deep work', statusDefault: UserStatus.BUSY }), newState);

				expect(result?.values).toEqual({ previousState: newState });
			});

			it('should treat expired previous as empty slot', () => {
				const newState = { statusDefault: UserStatus.BUSY, statusText: 'Deep work', statusSource: 'manual' as const };
				const result = setActive(
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
					newState,
				);

				expect(result?.values).toEqual({ previousState: newState });
			});

			it('should discard when previous has higher priority', () => {
				const result = setActive(
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
					{ statusDefault: UserStatus.BUSY, statusText: 'Standup', statusSource: 'external' },
				);

				expect(result).toBeNull();
			});

			it('should overwrite previous when it has same or lower priority', () => {
				const newState = { statusDefault: UserStatus.BUSY, statusText: 'Lunch', statusSource: 'manual' as const };
				const result = setActive(
					user({
						statusSource: 'internal',
						statusDefault: UserStatus.BUSY,
						previousState: { statusDefault: UserStatus.BUSY, statusText: 'WFH', statusSource: 'manual' },
					}),
					newState,
				);

				expect(result?.values).toEqual({ previousState: newState });
			});
		});

		describe('statusText handling', () => {
			it('when omitted, should not include statusText in values', () => {
				const result = setActive(user({ statusDefault: UserStatus.BUSY, statusText: 'Keep this', statusSource: 'manual' }), {
					statusDefault: UserStatus.AWAY,
					statusSource: 'manual',
				});

				expect(result?.values.statusText).toBeUndefined();
			});

			it('when empty string, should include it in values', () => {
				const result = setActive(user({ statusDefault: UserStatus.BUSY, statusText: 'Keep this', statusSource: 'manual' }), {
					statusDefault: UserStatus.AWAY,
					statusSource: 'manual',
					statusText: '',
				});

				expect(result?.values.statusText).toBe('');
			});
		});

		describe('emoji and expiresAt handling', () => {
			it('when provided, should include them in values', () => {
				const exp = new Date(Date.now() + ONE_HOUR);
				const result = setActive(user(), {
					statusDefault: UserStatus.BUSY,
					statusText: 'Focus',
					statusSource: 'manual',
					statusEmoji: '🔥',
					statusExpiresAt: exp,
				});

				expect(result?.values.statusEmoji).toBe('🔥');
				expect(result?.values.statusExpiresAt).toEqual(exp);
			});

			it('when absent, should add them to clear list', () => {
				const result = setActive(user({ statusEmoji: '🔥', statusExpiresAt: new Date() }), {
					statusDefault: UserStatus.BUSY,
					statusText: 'Focus',
					statusSource: 'manual',
				});

				expect(result?.clear).toContain('statusEmoji');
				expect(result?.clear).toContain('statusExpiresAt');
			});
		});

		describe('when the user is invisible (offline while connected)', () => {
			it('should discard automatic sources', () => {
				expect(setActive(invisibleUser(), { statusDefault: UserStatus.BUSY, statusSource: 'internal' })).toBeNull();
				expect(setActive(invisibleUser(), { statusDefault: UserStatus.BUSY, statusSource: 'external' })).toBeNull();
			});

			it('should still accept manual claims', () => {
				const result = setActive(invisibleUser(), {
					statusDefault: UserStatus.BUSY,
					statusSource: 'manual',
				});

				expect(result?.values.statusSource).toBe('manual');
				expect(result?.values.previousState).toBeUndefined();
			});
		});

		describe('when the user is truly offline (disconnected)', () => {
			it('should reject non-manual claims', () => {
				expect(
					setActive(user({ statusDefault: UserStatus.OFFLINE, statusConnection: UserStatus.OFFLINE }), {
						statusDefault: UserStatus.BUSY,
						statusSource: 'external',
					}),
				).toBeNull();
			});

			it('should accept manual claims', () => {
				const result = setActive(user({ statusDefault: UserStatus.OFFLINE, statusConnection: UserStatus.OFFLINE }), {
					statusDefault: UserStatus.BUSY,
					statusSource: 'manual',
				});

				expect(result?.values.statusSource).toBe('manual');
			});
		});
	});

	describe('endActive', () => {
		it('when previous is valid, should restore it', () => {
			const result = endActive(
				user({
					statusSource: 'manual',
					statusDefault: UserStatus.BUSY,
					previousState: { statusDefault: UserStatus.BUSY, statusText: 'Standup', statusSource: 'external' },
				}),
			);

			expect(result.values).toMatchObject({ statusSource: 'external', statusText: 'Standup', status: UserStatus.BUSY });
			expect(result.clear).toContain('previousState');
			expect(result.clear).toContain('statusEmoji');
		});

		it('when previous has emoji and expiresAt, should restore them', () => {
			const exp = new Date(Date.now() + ONE_HOUR);
			const result = endActive(
				user({
					statusSource: 'internal',
					statusDefault: UserStatus.BUSY,
					previousState: {
						statusDefault: UserStatus.BUSY,
						statusText: 'Standup',
						statusSource: 'external',
						statusEmoji: '📅',
						statusExpiresAt: exp,
					},
				}),
			);

			expect(result.values).toMatchObject({ statusSource: 'external', statusText: 'Standup', statusEmoji: '📅', statusExpiresAt: exp });
			expect(result.clear).toContain('previousState');
			expect(result.clear).not.toContain('statusEmoji');
		});

		it('when previous is expired, should fall back to system', () => {
			const result = endActive(
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
			);

			expect(result.values).toMatchObject({ statusDefault: UserStatus.ONLINE, statusText: '' });
			expect(result.clear).toEqual(expect.arrayContaining(['statusEmoji', 'statusSource', 'statusExpiresAt', 'previousState']));
		});

		it('when no previous exists, should fall back to system', () => {
			const result = endActive(user({ statusSource: 'internal', statusDefault: UserStatus.BUSY }));

			expect(result.values).toMatchObject({ statusDefault: UserStatus.ONLINE, statusText: '' });
			expect(result.clear).toEqual(expect.arrayContaining(['statusEmoji', 'statusSource', 'statusExpiresAt', 'previousState']));
		});
	});

	describe('clearActive', () => {
		it('should return values that reset to Online and clear all claim fields', () => {
			const result = clearActive();

			expect(result.values).toMatchObject({ statusDefault: UserStatus.ONLINE, statusText: '' });
			expect(result.clear).toEqual(expect.arrayContaining(['statusEmoji', 'statusSource', 'statusExpiresAt', 'previousState']));
		});
	});

	describe('precedence flows', () => {
		it('when a manual claim arrives over external, should save external as previous and restore it on end', () => {
			const setResult = setActive(user({ statusSource: 'external', statusDefault: UserStatus.BUSY, statusText: 'Standup' }), {
				statusDefault: UserStatus.BUSY,
				statusText: 'Deep work',
				statusSource: 'manual',
			});
			expect(setResult?.values.statusSource).toBe('manual');
			expect(setResult?.values.previousState).toMatchObject({ statusSource: 'external', statusText: 'Standup' });

			const endResult = endActive(
				user({
					statusSource: 'manual',
					statusDefault: UserStatus.BUSY,
					previousState: { statusDefault: UserStatus.BUSY, statusText: 'Standup', statusSource: 'external' },
				}),
			);
			expect(endResult.values).toMatchObject({ statusSource: 'external', statusText: 'Standup' });
			expect(endResult.clear).toContain('previousState');
		});

		it('when an external claim arrives during active manual, should queue it as previous and restore on end', () => {
			const setResult = setActive(user({ statusSource: 'manual', statusDefault: UserStatus.BUSY, statusText: 'Deep work' }), {
				statusDefault: UserStatus.BUSY,
				statusText: 'Standup',
				statusSource: 'external',
			});
			expect(setResult?.values).toEqual({
				previousState: { statusDefault: UserStatus.BUSY, statusText: 'Standup', statusSource: 'external' },
			});

			const endResult = endActive(
				user({
					statusSource: 'manual',
					statusDefault: UserStatus.BUSY,
					previousState: { statusDefault: UserStatus.BUSY, statusText: 'Standup', statusSource: 'external' },
				}),
			);
			expect(endResult.values).toMatchObject({ statusSource: 'external', statusText: 'Standup', statusDefault: UserStatus.BUSY });
		});

		it('when an external claim arrives during active internal, should queue it, restore on end, then reset to system', () => {
			const setResult = setActive(user({ statusSource: 'internal', statusDefault: UserStatus.BUSY, statusText: 'On a call' }), {
				statusDefault: UserStatus.BUSY,
				statusText: 'Standup',
				statusSource: 'external',
			});
			expect(setResult?.values).toEqual({
				previousState: { statusDefault: UserStatus.BUSY, statusText: 'Standup', statusSource: 'external' },
			});

			const endResult = endActive(
				user({
					statusSource: 'internal',
					statusDefault: UserStatus.BUSY,
					previousState: { statusDefault: UserStatus.BUSY, statusText: 'Standup', statusSource: 'external' },
				}),
			);
			expect(endResult.values).toMatchObject({ statusSource: 'external', statusText: 'Standup' });

			const endResult2 = endActive(user({ statusSource: 'external', statusDefault: UserStatus.BUSY }));
			expect(endResult2.values).toMatchObject({ statusDefault: UserStatus.ONLINE });
			expect(endResult2.clear).toContain('statusSource');
		});

		it('when an internal claim arrives over active external with emoji, should save external as previous and restore it with emoji on end', () => {
			const exp = new Date(Date.now() + ONE_HOUR);

			const setResult = setActive(
				user({ statusSource: 'external', statusDefault: UserStatus.BUSY, statusText: 'Standup', statusEmoji: '📅', statusExpiresAt: exp }),
				{ statusDefault: UserStatus.BUSY, statusText: 'On a call', statusSource: 'internal', statusEmoji: '📞' },
			);
			expect(setResult?.values.statusSource).toBe('internal');
			expect(setResult?.values.previousState).toMatchObject({ statusSource: 'external', statusExpiresAt: exp });

			const endResult = endActive(
				user({
					statusSource: 'internal',
					statusDefault: UserStatus.BUSY,
					previousState: {
						statusDefault: UserStatus.BUSY,
						statusText: 'Standup',
						statusSource: 'external',
						statusEmoji: '📅',
						statusExpiresAt: exp,
					},
				}),
			);
			expect(endResult.values).toMatchObject({ statusSource: 'external', statusEmoji: '📅' });
			expect(endResult.clear).not.toContain('statusEmoji');
		});

		it('when previous has expired while internal is active, should ignore previous and reset to system on end', () => {
			const result = endActive(
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
			);

			expect(result.values).toMatchObject({ statusDefault: UserStatus.ONLINE });
			expect(result.clear).toContain('previousState');
		});

		it('when a same-priority manual arrives over active manual, should overwrite active and keep previous untouched', () => {
			const result = setActive(
				user({
					statusSource: 'manual',
					statusDefault: UserStatus.BUSY,
					statusText: 'WFH',
					previousState: { statusDefault: UserStatus.BUSY, statusText: 'Standup', statusSource: 'external' },
				}),
				{ statusDefault: UserStatus.AWAY, statusText: 'Lunch', statusSource: 'manual' },
			);

			expect(result?.values.statusSource).toBe('manual');
			expect(result?.values.statusText).toBe('Lunch');
			expect(result?.values.previousState).toBeUndefined();
		});

		it('when an internal claim arrives over manual, should save manual as previous and restore it on end', () => {
			const setResult = setActive(user({ statusSource: 'manual', statusDefault: UserStatus.BUSY, statusText: 'Deep work' }), {
				statusDefault: UserStatus.BUSY,
				statusText: 'On a call',
				statusSource: 'internal',
			});
			expect(setResult?.values.statusSource).toBe('internal');
			expect(setResult?.values.previousState).toMatchObject({ statusSource: 'manual', statusText: 'Deep work' });

			const endResult = endActive(
				user({
					statusSource: 'internal',
					statusDefault: UserStatus.BUSY,
					previousState: { statusDefault: UserStatus.BUSY, statusText: 'Deep work', statusSource: 'manual' },
				}),
			);
			expect(endResult.values).toMatchObject({ statusSource: 'manual', statusText: 'Deep work' });
			expect(endResult.clear).toContain('previousState');
		});
	});
});
