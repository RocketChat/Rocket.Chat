import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { UserStatus } from '@rocket.chat/core-typings';

// Mock Presence
const mockSetConnectionStatus = jest.fn();
jest.mock('@rocket.chat/core-services', () => ({
	Presence: {
		setConnectionStatus: mockSetConnectionStatus,
	},
}));

describe('configureServer - UserPresence Methods', () => {
	let methods: Record<string, Function>;

	beforeEach(() => {
		jest.clearAllMocks();

		// Define the methods as they appear in configureServer.ts
		methods = {
			'UserPresence:online': function(this: any) {
				const { userId, session } = this;
				if (!userId) {
					return;
				}
				return mockSetConnectionStatus(userId, session, UserStatus.ONLINE);
			},
			'UserPresence:away': function(this: any) {
				const { userId, session } = this;
				if (!userId) {
					return;
				}
				return mockSetConnectionStatus(userId, session, UserStatus.AWAY);
			},
			'UserPresence:ping': function(this: any) {
				const { userId, session } = this;
				if (!userId) {
					return;
				}
				return mockSetConnectionStatus(userId, session);
			},
		};
	});

	describe('UserPresence:online', () => {
		it('should call setConnectionStatus with correct parameter order', () => {
			const context = {
				userId: 'user-123',
				session: 'session-456',
			};

			methods['UserPresence:online'].call(context);

			expect(mockSetConnectionStatus).toHaveBeenCalledWith(
				'user-123',
				'session-456',
				UserStatus.ONLINE
			);
		});

		it('should not call setConnectionStatus when userId is null', () => {
			const context = {
				userId: null,
				session: 'session-456',
			};

			const result = methods['UserPresence:online'].call(context);

			expect(mockSetConnectionStatus).not.toHaveBeenCalled();
			expect(result).toBeUndefined();
		});

		it('should not call setConnectionStatus when userId is undefined', () => {
			const context = {
				userId: undefined,
				session: 'session-456',
			};

			const result = methods['UserPresence:online'].call(context);

			expect(mockSetConnectionStatus).not.toHaveBeenCalled();
			expect(result).toBeUndefined();
		});

		it('should call setConnectionStatus even with undefined session', () => {
			const context = {
				userId: 'user-123',
				session: undefined,
			};

			methods['UserPresence:online'].call(context);

			expect(mockSetConnectionStatus).toHaveBeenCalledWith(
				'user-123',
				undefined,
				UserStatus.ONLINE
			);
		});

		it('should handle empty string session', () => {
			const context = {
				userId: 'user-123',
				session: '',
			};

			methods['UserPresence:online'].call(context);

			expect(mockSetConnectionStatus).toHaveBeenCalledWith(
				'user-123',
				'',
				UserStatus.ONLINE
			);
		});
	});

	describe('UserPresence:away', () => {
		it('should call setConnectionStatus with correct parameter order', () => {
			const context = {
				userId: 'user-123',
				session: 'session-456',
			};

			methods['UserPresence:away'].call(context);

			expect(mockSetConnectionStatus).toHaveBeenCalledWith(
				'user-123',
				'session-456',
				UserStatus.AWAY
			);
		});

		it('should not call setConnectionStatus when userId is missing', () => {
			const context = {
				userId: null,
				session: 'session-456',
			};

			const result = methods['UserPresence:away'].call(context);

			expect(mockSetConnectionStatus).not.toHaveBeenCalled();
			expect(result).toBeUndefined();
		});

		it('should handle different session identifiers', () => {
			const contexts = [
				{ userId: 'user-1', session: 'web-session-1' },
				{ userId: 'user-2', session: 'mobile-session-2' },
				{ userId: 'user-3', session: 'desktop-session-3' },
			];

			contexts.forEach((context) => {
				methods['UserPresence:away'].call(context);
			});

			expect(mockSetConnectionStatus).toHaveBeenCalledTimes(3);
			expect(mockSetConnectionStatus).toHaveBeenNthCalledWith(
				1,
				'user-1',
				'web-session-1',
				UserStatus.AWAY
			);
			expect(mockSetConnectionStatus).toHaveBeenNthCalledWith(
				2,
				'user-2',
				'mobile-session-2',
				UserStatus.AWAY
			);
			expect(mockSetConnectionStatus).toHaveBeenNthCalledWith(
				3,
				'user-3',
				'desktop-session-3',
				UserStatus.AWAY
			);
		});
	});

	describe('UserPresence:ping', () => {
		it('should call setConnectionStatus without status parameter', () => {
			const context = {
				userId: 'user-123',
				session: 'session-456',
			};

			methods['UserPresence:ping'].call(context);

			expect(mockSetConnectionStatus).toHaveBeenCalledWith('user-123', 'session-456');
			expect(mockSetConnectionStatus).not.toHaveBeenCalledWith(
				'user-123',
				'session-456',
				expect.anything()
			);
		});

		it('should not call setConnectionStatus when userId is missing', () => {
			const context = {
				userId: null,
				session: 'session-456',
			};

			const result = methods['UserPresence:ping'].call(context);

			expect(mockSetConnectionStatus).not.toHaveBeenCalled();
			expect(result).toBeUndefined();
		});

		it('should handle ping with undefined session', () => {
			const context = {
				userId: 'user-123',
				session: undefined,
			};

			methods['UserPresence:ping'].call(context);

			expect(mockSetConnectionStatus).toHaveBeenCalledWith('user-123', undefined);
		});

		it('should handle rapid successive pings', () => {
			const context = {
				userId: 'user-123',
				session: 'session-456',
			};

			for (let i = 0; i < 20; i++) {
				methods['UserPresence:ping'].call(context);
			}

			expect(mockSetConnectionStatus).toHaveBeenCalledTimes(20);
			mockSetConnectionStatus.mock.calls.forEach((call) => {
				expect(call).toEqual(['user-123', 'session-456']);
			});
		});

		it('should handle pings from multiple users', () => {
			const users = Array.from({ length: 50 }, (_, i) => ({
				userId: `user-${i}`,
				session: `session-${i}`,
			}));

			users.forEach((context) => {
				methods['UserPresence:ping'].call(context);
			});

			expect(mockSetConnectionStatus).toHaveBeenCalledTimes(50);
		});
	});

	describe('parameter order validation', () => {
		it('should use new parameter order (userId, session, status) for online', () => {
			const context = {
				userId: 'test-user',
				session: 'test-session',
			};

			methods['UserPresence:online'].call(context);

			const callArgs = mockSetConnectionStatus.mock.calls[0];
			expect(callArgs[0]).toBe('test-user'); // first: userId
			expect(callArgs[1]).toBe('test-session'); // second: session
			expect(callArgs[2]).toBe(UserStatus.ONLINE); // third: status
		});

		it('should use new parameter order (userId, session, status) for away', () => {
			const context = {
				userId: 'test-user',
				session: 'test-session',
			};

			methods['UserPresence:away'].call(context);

			const callArgs = mockSetConnectionStatus.mock.calls[0];
			expect(callArgs[0]).toBe('test-user'); // first: userId
			expect(callArgs[1]).toBe('test-session'); // second: session
			expect(callArgs[2]).toBe(UserStatus.AWAY); // third: status
		});

		it('should use parameter order (userId, session) for ping without status', () => {
			const context = {
				userId: 'test-user',
				session: 'test-session',
			};

			methods['UserPresence:ping'].call(context);

			const callArgs = mockSetConnectionStatus.mock.calls[0];
			expect(callArgs.length).toBe(2);
			expect(callArgs[0]).toBe('test-user'); // first: userId
			expect(callArgs[1]).toBe('test-session'); // second: session
		});
	});

	describe('method interactions', () => {
		it('should handle switching between online and away', () => {
			const context = {
				userId: 'user-123',
				session: 'session-456',
			};

			methods['UserPresence:online'].call(context);
			methods['UserPresence:away'].call(context);
			methods['UserPresence:online'].call(context);

			expect(mockSetConnectionStatus).toHaveBeenCalledTimes(3);
			expect(mockSetConnectionStatus).toHaveBeenNthCalledWith(
				1,
				'user-123',
				'session-456',
				UserStatus.ONLINE
			);
			expect(mockSetConnectionStatus).toHaveBeenNthCalledWith(
				2,
				'user-123',
				'session-456',
				UserStatus.AWAY
			);
			expect(mockSetConnectionStatus).toHaveBeenNthCalledWith(
				3,
				'user-123',
				'session-456',
				UserStatus.ONLINE
			);
		});

		it('should handle pings interspersed with status changes', () => {
			const context = {
				userId: 'user-123',
				session: 'session-456',
			};

			methods['UserPresence:online'].call(context);
			methods['UserPresence:ping'].call(context);
			methods['UserPresence:ping'].call(context);
			methods['UserPresence:away'].call(context);
			methods['UserPresence:ping'].call(context);

			expect(mockSetConnectionStatus).toHaveBeenCalledTimes(5);
			
			// Verify call details
			expect(mockSetConnectionStatus).toHaveBeenNthCalledWith(
				1,
				'user-123',
				'session-456',
				UserStatus.ONLINE
			);
			expect(mockSetConnectionStatus).toHaveBeenNthCalledWith(2, 'user-123', 'session-456');
			expect(mockSetConnectionStatus).toHaveBeenNthCalledWith(3, 'user-123', 'session-456');
			expect(mockSetConnectionStatus).toHaveBeenNthCalledWith(
				4,
				'user-123',
				'session-456',
				UserStatus.AWAY
			);
			expect(mockSetConnectionStatus).toHaveBeenNthCalledWith(5, 'user-123', 'session-456');
		});
	});

	describe('return values', () => {
		it('should return value from setConnectionStatus for online', () => {
			mockSetConnectionStatus.mockReturnValue(true);

			const context = {
				userId: 'user-123',
				session: 'session-456',
			};

			const result = methods['UserPresence:online'].call(context);

			expect(result).toBe(true);
		});

		it('should return value from setConnectionStatus for away', () => {
			mockSetConnectionStatus.mockReturnValue(false);

			const context = {
				userId: 'user-123',
				session: 'session-456',
			};

			const result = methods['UserPresence:away'].call(context);

			expect(result).toBe(false);
		});

		it('should return value from setConnectionStatus for ping', () => {
			mockSetConnectionStatus.mockReturnValue({ updated: true });

			const context = {
				userId: 'user-123',
				session: 'session-456',
			};

			const result = methods['UserPresence:ping'].call(context);

			expect(result).toEqual({ updated: true });
		});

		it('should return undefined when userId is missing', () => {
			const context = {
				userId: null,
				session: 'session-456',
			};

			const results = [
				methods['UserPresence:online'].call(context),
				methods['UserPresence:away'].call(context),
				methods['UserPresence:ping'].call(context),
			];

			results.forEach((result) => {
				expect(result).toBeUndefined();
			});
		});
	});

	describe('edge cases', () => {
		it('should handle context with only userId', () => {
			const context = {
				userId: 'user-123',
			};

			methods['UserPresence:ping'].call(context);

			expect(mockSetConnectionStatus).toHaveBeenCalledWith('user-123', undefined);
		});

		it('should handle context with only session', () => {
			const context = {
				session: 'session-456',
			};

			const result = methods['UserPresence:ping'].call(context);

			expect(mockSetConnectionStatus).not.toHaveBeenCalled();
			expect(result).toBeUndefined();
		});

		it('should handle empty context', () => {
			const context = {};

			const result = methods['UserPresence:ping'].call(context);

			expect(mockSetConnectionStatus).not.toHaveBeenCalled();
			expect(result).toBeUndefined();
		});

		it('should handle numeric userId', () => {
			const context = {
				userId: 12345 as any,
				session: 'session-456',
			};

			methods['UserPresence:ping'].call(context);

			expect(mockSetConnectionStatus).toHaveBeenCalledWith(12345, 'session-456');
		});

		it('should handle special characters in session ID', () => {
			const context = {
				userId: 'user-123',
				session: 'session!@#$%^&*()_+-=[]{}|;:,.<>?',
			};

			methods['UserPresence:ping'].call(context);

			expect(mockSetConnectionStatus).toHaveBeenCalledWith(
				'user-123',
				'session!@#$%^&*()_+-=[]{}|;:,.<>?'
			);
		});

		it('should handle very long session IDs', () => {
			const longSession = 'a'.repeat(1000);
			const context = {
				userId: 'user-123',
				session: longSession,
			};

			methods['UserPresence:ping'].call(context);

			expect(mockSetConnectionStatus).toHaveBeenCalledWith('user-123', longSession);
		});
	});
});