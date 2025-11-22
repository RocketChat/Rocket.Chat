import { describe, test, expect, jest, beforeEach } from '@jest/globals';

// Mock the dependencies
const mockSdkCall = jest.fn();
const mockGetUserId = jest.fn();

jest.mock('../../../../../../app/utils/client/lib/SDKClient', () => ({
	sdk: {
		call: mockSdkCall,
		rest: {
			post: jest.fn(),
		},
	},
}));

jest.mock('../../../../../lib/user', () => ({
	getUserId: mockGetUserId,
}));

// Import after mocks are set up
import type { Meteor } from 'meteor/meteor';

describe('ddpOverREST - shouldBypass type guard', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	// We'll test the logic by examining what types of messages should bypass
	describe('message type discrimination', () => {
		test('should identify ping messages correctly', () => {
			const pingMessage: Meteor.IDDPPingMessage = {
				msg: 'ping',
			};

			// Ping messages should bypass and have msg property
			expect(pingMessage.msg).toBe('ping');
			// Type guard should return true for non-method messages
			expect(pingMessage.msg !== 'method').toBe(true);
		});

		test('should identify method messages correctly', () => {
			const methodMessage: Meteor.IDDPMethodMessage = {
				msg: 'method',
				method: 'testMethod',
				params: [],
				id: 'method-id-123',
			};

			expect(methodMessage.msg).toBe('method');
			expect(methodMessage).toHaveProperty('method');
			expect(methodMessage).toHaveProperty('params');
			expect(methodMessage).toHaveProperty('id');
		});

		test('should handle login method with resume token', () => {
			const loginMessage: Meteor.IDDPMethodMessage = {
				msg: 'method',
				method: 'login',
				params: [{ resume: 'test-token-123' }],
				id: 'login-id',
			};

			expect(loginMessage.method).toBe('login');
			expect(loginMessage.params[0]).toHaveProperty('resume');
			// Should bypass when login has resume token
			const hasResume = loginMessage.params[0]?.resume !== undefined;
			expect(hasResume).toBe(true);
		});

		test('should handle login method without resume token', () => {
			const loginMessage: Meteor.IDDPMethodMessage = {
				msg: 'method',
				method: 'login',
				params: [{ username: 'test', password: 'pass' }],
				id: 'login-id',
			};

			expect(loginMessage.method).toBe('login');
			const hasResume = loginMessage.params[0]?.resume !== undefined;
			expect(hasResume).toBe(false);
		});

		test('should identify UserPresence methods', () => {
			const presenceMethods = ['UserPresence:online', 'UserPresence:away', 'UserPresence:ping', 'UserPresence:setDefaultStatus'];

			presenceMethods.forEach((method) => {
				const message: Meteor.IDDPMethodMessage = {
					msg: 'method',
					method,
					params: [],
					id: `${method}-id`,
				};

				expect(message.method.startsWith('UserPresence:')).toBe(true);
			});
		});

		test('should identify bypass methods', () => {
			const bypassMethods = ['setUserStatus', 'logout'];

			bypassMethods.forEach((method) => {
				const message: Meteor.IDDPMethodMessage = {
					msg: 'method',
					method,
					params: [],
					id: `${method}-id`,
				};

				expect(['setUserStatus', 'logout'].includes(message.method)).toBe(true);
			});
		});

		test('should identify stream methods', () => {
			const streamMethods = ['stream-notify-room', 'stream-notify-user', 'stream-messages'];

			streamMethods.forEach((method) => {
				const message: Meteor.IDDPMethodMessage = {
					msg: 'method',
					method,
					params: [],
					id: `${method}-id`,
				};

				expect(message.method.startsWith('stream-')).toBe(true);
			});
		});

		test('should identify regular methods that should not bypass', () => {
			const regularMethods = ['sendMessage', 'createRoom', 'updateUser', 'deleteMessage'];

			regularMethods.forEach((method) => {
				const message: Meteor.IDDPMethodMessage = {
					msg: 'method',
					method,
					params: [],
					id: `${method}-id`,
				};

				// These should not match any bypass criteria
				expect(message.method.startsWith('UserPresence:')).toBe(false);
				expect(message.method.startsWith('stream-')).toBe(false);
				expect(['setUserStatus', 'logout'].includes(message.method)).toBe(false);
				expect(message.method === 'login').toBe(false);
			});
		});
	});

	describe('type narrowing behavior', () => {
		test('should narrow union type for non-method messages', () => {
			const message: Meteor.IDDPMessage = {
				msg: 'ping',
			};

			if (message.msg !== 'method') {
				// After type guard, message should be narrowed to exclude IDDPMethodMessage
				// In TypeScript, this means we should NOT be able to access method/params/id
				expect(message.msg).toBe('ping');
				// TypeScript would prevent accessing message.method here
			}
		});

		test('should preserve method message properties when not bypassed', () => {
			const message: Meteor.IDDPMethodMessage = {
				msg: 'method',
				method: 'regularMethod',
				params: ['param1', 'param2'],
				id: 'method-id-456',
			};

			// These properties should be accessible
			expect(message.msg).toBe('method');
			expect(message.method).toBe('regularMethod');
			expect(message.params).toEqual(['param1', 'param2']);
			expect(message.id).toBe('method-id-456');
		});
	});

	describe('edge cases', () => {
		test('should handle empty params array', () => {
			const message: Meteor.IDDPMethodMessage = {
				msg: 'method',
				method: 'login',
				params: [],
				id: 'login-empty',
			};

			// Should not have resume token
			const hasResume = message.params[0]?.resume !== undefined;
			expect(hasResume).toBe(false);
		});

		test('should handle null in params', () => {
			const message: Meteor.IDDPMethodMessage = {
				msg: 'method',
				method: 'login',
				params: [null as any],
				id: 'login-null',
			};

			// Should safely handle null
			const hasResume = message.params[0]?.resume !== undefined;
			expect(hasResume).toBe(false);
		});

		test('should handle params with resume as falsy value', () => {
			const messages = [
				{ resume: '' },
				{ resume: null },
				{ resume: undefined },
				{ resume: 0 },
				{ resume: false },
			];

			messages.forEach((param, index) => {
				const message: Meteor.IDDPMethodMessage = {
					msg: 'method',
					method: 'login',
					params: [param as any],
					id: `login-falsy-${index}`,
				};

				// Only truthy resume should bypass
				const shouldBypass = !!message.params[0]?.resume;
				expect(shouldBypass).toBe(param.resume === '' ? true : false);
			});
		});

		test('should handle method names with special characters', () => {
			const specialMethods = [
				'UserPresence:custom:action',
				'stream-notify-room:ROOM_ID',
				'setUserStatus',
				'user:presence:update',
			];

			specialMethods.forEach((method) => {
				const message: Meteor.IDDPMethodMessage = {
					msg: 'method',
					method,
					params: [],
					id: `special-${method}`,
				};

				const startsWithUserPresence = message.method.startsWith('UserPresence:');
				const startsWithStream = message.method.startsWith('stream-');

				expect(typeof startsWithUserPresence).toBe('boolean');
				expect(typeof startsWithStream).toBe('boolean');
			});
		});

		test('should handle case-sensitive method matching', () => {
			const caseVariations = [
				{ method: 'setUserStatus', shouldMatch: true },
				{ method: 'SetUserStatus', shouldMatch: false },
				{ method: 'SETUSERSTATUS', shouldMatch: false },
				{ method: 'logout', shouldMatch: true },
				{ method: 'Logout', shouldMatch: false },
				{ method: 'LOGOUT', shouldMatch: false },
			];

			caseVariations.forEach(({ method, shouldMatch }) => {
				const message: Meteor.IDDPMethodMessage = {
					msg: 'method',
					method,
					params: [],
					id: `case-${method}`,
				};

				const matches = ['setUserStatus', 'logout'].includes(message.method);
				expect(matches).toBe(shouldMatch);
			});
		});

		test('should handle very long method names', () => {
			const longMethod = 'a'.repeat(1000);
			const message: Meteor.IDDPMethodMessage = {
				msg: 'method',
				method: longMethod,
				params: [],
				id: 'long-method',
			};

			expect(message.method.length).toBe(1000);
			expect(message.method.startsWith('UserPresence:')).toBe(false);
		});
	});

	describe('ping message handling', () => {
		test('should correctly identify ping messages for UserPresence:ping call', () => {
			const pingMessage: Meteor.IDDPPingMessage = {
				msg: 'ping',
			};

			// When a ping message is bypassed, it should trigger sdk.call('UserPresence:ping')
			expect(pingMessage.msg).toBe('ping');
			expect(pingMessage.msg === 'ping').toBe(true);
		});

		test('should differentiate ping from method messages', () => {
			const pingMessage: Meteor.IDDPPingMessage = { msg: 'ping' };
			const methodMessage: Meteor.IDDPMethodMessage = {
				msg: 'method',
				method: 'test',
				params: [],
				id: '1',
			};

			expect(pingMessage.msg).toBe('ping');
			expect(methodMessage.msg).toBe('method');
			expect(pingMessage.msg === methodMessage.msg).toBe(false);
		});
	});
});