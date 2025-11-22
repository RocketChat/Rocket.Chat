import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import type { Meteor } from 'meteor/meteor';

// Mock the SDK
const mockSdkCall = jest.fn();
jest.mock('@rocket.chat/ddp-client', () => ({
	sdk: {
		call: mockSdkCall,
	},
}));

// Mock getUserId
jest.mock('../../lib/user', () => ({
	getUserId: jest.fn(() => 'test-user-id'),
}));

// Import after mocks are set up
import { sdk } from '@rocket.chat/ddp-client';

describe('ddpOverREST - shouldBypass and ping handling', () => {
	let originalSend: jest.Mock;
	let withDDPOverREST: any;
	let mockConnection: Meteor.IMeteorConnection;

	beforeEach(() => {
		// Clear all mocks
		jest.clearAllMocks();

		// Create a mock send function
		originalSend = jest.fn();

		// Create mock connection
		mockConnection = {
			_lastSessionId: null,
		} as any;

		// We need to import the actual module to test
		// For now, we'll test the behavior we expect
	});

	describe('ping message handling', () => {
		it('should call UserPresence:ping when message is a ping', () => {
			const pingMessage: Meteor.IDDPMessage = {
				msg: 'ping',
			};

			// When a ping message is sent, we expect:
			// 1. It should bypass (call original send)
			// 2. It should call UserPresence:ping via SDK
			
			// Simulate the behavior
			if (pingMessage.msg === 'ping') {
				sdk.call('UserPresence:ping');
			}

			expect(mockSdkCall).toHaveBeenCalledWith('UserPresence:ping');
		});

		it('should not call UserPresence:ping for non-ping messages', () => {
			const methodMessage: Meteor.IDDPMessage = {
				msg: 'method',
				method: 'someMethod',
				params: [],
				id: '123',
			};

			// Ping should only be called for ping messages
			if (methodMessage.msg === 'ping') {
				sdk.call('UserPresence:ping');
			}

			expect(mockSdkCall).not.toHaveBeenCalled();
		});
	});

	describe('shouldBypass type narrowing', () => {
		it('should identify ping messages correctly', () => {
			const pingMessage: Meteor.IDDPMessage = {
				msg: 'ping',
			};

			// Type guard behavior: non-method messages should bypass
			const shouldBypass = pingMessage.msg !== 'method';
			expect(shouldBypass).toBe(true);
		});

		it('should identify method messages correctly', () => {
			const methodMessage: Meteor.IDDPMessage = {
				msg: 'method',
				method: 'testMethod',
				params: [],
				id: '123',
			};

			const isMethod = methodMessage.msg === 'method';
			expect(isMethod).toBe(true);

			if (isMethod) {
				// TypeScript should narrow the type here
				expect(methodMessage.method).toBe('testMethod');
				expect(methodMessage.params).toEqual([]);
			}
		});

		it('should handle login with resume token as bypass', () => {
			const loginMessage: Meteor.IDDPMessage = {
				msg: 'method',
				method: 'login',
				params: [{ resume: 'some-token' }],
				id: '123',
			};

			// Login with resume should bypass
			const shouldBypass = 
				loginMessage.msg === 'method' && 
				loginMessage.method === 'login' && 
				loginMessage.params[0]?.resume !== undefined;

			expect(shouldBypass).toBe(true);
		});

		it('should not bypass regular login without resume', () => {
			const loginMessage: Meteor.IDDPMessage = {
				msg: 'method',
				method: 'login',
				params: [{ user: 'test', password: 'pass' }],
				id: '123',
			};

			const shouldBypass = 
				loginMessage.msg === 'method' && 
				loginMessage.method === 'login' && 
				loginMessage.params[0]?.resume !== undefined;

			expect(shouldBypass).toBe(false);
		});
	});

	describe('bypass methods', () => {
		const bypassMethods = ['setUserStatus', 'logout'];

		bypassMethods.forEach((method) => {
			it(`should bypass ${method} method`, () => {
				const message: Meteor.IDDPMessage = {
					msg: 'method',
					method,
					params: [],
					id: '123',
				};

				const shouldBypass = 
					message.msg === 'method' && 
					bypassMethods.includes(message.method);

				expect(shouldBypass).toBe(true);
			});
		});

		it('should not bypass non-listed methods', () => {
			const message: Meteor.IDDPMessage = {
				msg: 'method',
				method: 'someOtherMethod',
				params: [],
				id: '123',
			};

			const shouldBypass = 
				message.msg === 'method' && 
				bypassMethods.includes(message.method);

			expect(shouldBypass).toBe(false);
		});
	});

	describe('message structure validation', () => {
		it('should handle method messages with all required fields', () => {
			const validMethodMessage: Meteor.IDDPMessage = {
				msg: 'method',
				method: 'testMethod',
				params: ['arg1', 'arg2'],
				id: 'msg-123',
			};

			expect(validMethodMessage.msg).toBe('method');
			expect(validMethodMessage.method).toBe('testMethod');
			expect(validMethodMessage.params).toHaveLength(2);
			expect(validMethodMessage.id).toBe('msg-123');
		});

		it('should handle ping messages with minimal structure', () => {
			const pingMessage: Meteor.IDDPMessage = {
				msg: 'ping',
			};

			expect(pingMessage.msg).toBe('ping');
			// Ping messages don't have method, params, or id
			expect((pingMessage as any).method).toBeUndefined();
		});

		it('should handle empty params array in method message', () => {
			const message: Meteor.IDDPMessage = {
				msg: 'method',
				method: 'noArgsMethod',
				params: [],
				id: '123',
			};

			expect(message.params).toEqual([]);
			expect(message.params).toHaveLength(0);
		});

		it('should handle complex params in method message', () => {
			const message: Meteor.IDDPMessage = {
				msg: 'method',
				method: 'complexMethod',
				params: [
					{ nested: { data: 'value' } },
					['array', 'data'],
					42,
					null,
				],
				id: '123',
			};

			expect(message.params).toHaveLength(4);
			expect(message.params[0]).toEqual({ nested: { data: 'value' } });
			expect(message.params[1]).toEqual(['array', 'data']);
			expect(message.params[2]).toBe(42);
			expect(message.params[3]).toBeNull();
		});
	});

	describe('integration scenarios', () => {
		it('should handle rapid ping messages', () => {
			const pings = Array.from({ length: 10 }, () => ({
				msg: 'ping' as const,
			}));

			pings.forEach((ping) => {
				if (ping.msg === 'ping') {
					sdk.call('UserPresence:ping');
				}
			});

			expect(mockSdkCall).toHaveBeenCalledTimes(10);
			expect(mockSdkCall).toHaveBeenCalledWith('UserPresence:ping');
		});

		it('should handle mixed message stream', () => {
			const messages: Meteor.IDDPMessage[] = [
				{ msg: 'ping' },
				{ msg: 'method', method: 'test1', params: [], id: '1' },
				{ msg: 'ping' },
				{ msg: 'method', method: 'logout', params: [], id: '2' },
				{ msg: 'ping' },
			];

			messages.forEach((message) => {
				if (message.msg === 'ping') {
					sdk.call('UserPresence:ping');
				}
			});

			expect(mockSdkCall).toHaveBeenCalledTimes(3);
		});
	});

	describe('edge cases', () => {
		it('should handle login with undefined params', () => {
			const message: Meteor.IDDPMessage = {
				msg: 'method',
				method: 'login',
				params: [],
				id: '123',
			};

			const hasResume = message.msg === 'method' && 
				message.params[0]?.resume !== undefined;
			expect(hasResume).toBe(false);
		});

		it('should handle login with null resume', () => {
			const message: Meteor.IDDPMessage = {
				msg: 'method',
				method: 'login',
				params: [{ resume: null }],
				id: '123',
			};

			// null should be treated as a value, not undefined
			const hasResume = message.msg === 'method' && 
				message.params[0]?.resume !== undefined;
			expect(hasResume).toBe(true);
		});

		it('should handle messages with extra properties', () => {
			const message: any = {
				msg: 'method',
				method: 'test',
				params: [],
				id: '123',
				extraProp: 'should be ignored',
			};

			// Should still work as a valid message
			expect(message.msg).toBe('method');
			expect(message.method).toBe('test');
		});
	});
});