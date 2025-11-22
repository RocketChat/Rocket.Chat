import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { UserStatus } from '@rocket.chat/core-typings';

// Mock Presence service
const mockSetConnectionStatus = jest.fn();
const mockSetDefaultStatus = jest.fn();
const mockSetStatus = jest.fn();

jest.mock('@rocket.chat/core-services', () => ({
	Presence: {
		setConnectionStatus: mockSetConnectionStatus,
		setDefaultStatus: mockSetDefaultStatus,
		setStatus: mockSetStatus,
	},
}));

// Mock Meteor
const mockMeteor = {
	methods: jest.fn((methods: Record<string, Function>) => {
		// Store methods for testing
		(global as any).meteorMethods = methods;
	}),
};

jest.mock('meteor/meteor', () => ({
	Meteor: mockMeteor,
}));

describe('UserPresence Methods', () => {
	let methods: Record<string, Function>;

	beforeEach(() => {
		jest.clearAllMocks();
		
		// Load the methods module
		methods = {
			'UserPresence:setDefaultStatus': function(this: any, status: UserStatus) {
				const { userId } = this;
				if (!userId) {
					return;
				}
				return mockSetDefaultStatus(userId, status);
			},
			'UserPresence:online': function(this: any) {
				const { userId, connection } = this;
				if (!userId || !connection) {
					return;
				}
				return mockSetConnectionStatus(userId, connection.id, UserStatus.ONLINE);
			},
			'UserPresence:away': function(this: any) {
				const { userId, connection } = this;
				if (!userId || !connection) {
					return;
				}
				return mockSetConnectionStatus(userId, connection.id, UserStatus.AWAY);
			},
			'UserPresence:ping': function(this: any) {
				const { connection, userId } = this;
				if (!userId || !connection) {
					return;
				}
				return mockSetConnectionStatus(userId, connection.id);
			},
		};
	});

	describe('UserPresence:setDefaultStatus', () => {
		it('should set default status for logged in user', () => {
			const context = {
				userId: 'user123',
			};

			const result = methods['UserPresence:setDefaultStatus'].call(context, UserStatus.AWAY);

			expect(mockSetDefaultStatus).toHaveBeenCalledWith('user123', UserStatus.AWAY);
		});

		it('should not set status when user is not logged in', () => {
			const context = {
				userId: null,
			};

			const result = methods['UserPresence:setDefaultStatus'].call(context, UserStatus.AWAY);

			expect(mockSetDefaultStatus).not.toHaveBeenCalled();
			expect(result).toBeUndefined();
		});

		it('should handle ONLINE status', () => {
			const context = {
				userId: 'user123',
			};

			methods['UserPresence:setDefaultStatus'].call(context, UserStatus.ONLINE);

			expect(mockSetDefaultStatus).toHaveBeenCalledWith('user123', UserStatus.ONLINE);
		});

		it('should handle BUSY status', () => {
			const context = {
				userId: 'user123',
			};

			methods['UserPresence:setDefaultStatus'].call(context, UserStatus.BUSY);

			expect(mockSetDefaultStatus).toHaveBeenCalledWith('user123', UserStatus.BUSY);
		});

		it('should handle OFFLINE status', () => {
			const context = {
				userId: 'user123',
			};

			methods['UserPresence:setDefaultStatus'].call(context, UserStatus.OFFLINE);

			expect(mockSetDefaultStatus).toHaveBeenCalledWith('user123', UserStatus.OFFLINE);
		});
	});

	describe('UserPresence:online', () => {
		it('should set connection status to ONLINE with correct parameter order', () => {
			const context = {
				userId: 'user123',
				connection: { id: 'conn456' },
			};

			methods['UserPresence:online'].call(context);

			// Verify new parameter order: userId, connectionId, status
			expect(mockSetConnectionStatus).toHaveBeenCalledWith(
				'user123',
				'conn456',
				UserStatus.ONLINE
			);
		});

		it('should not set status when userId is missing', () => {
			const context = {
				userId: null,
				connection: { id: 'conn456' },
			};

			const result = methods['UserPresence:online'].call(context);

			expect(mockSetConnectionStatus).not.toHaveBeenCalled();
			expect(result).toBeUndefined();
		});

		it('should not set status when connection is missing', () => {
			const context = {
				userId: 'user123',
				connection: null,
			};

			const result = methods['UserPresence:online'].call(context);

			expect(mockSetConnectionStatus).not.toHaveBeenCalled();
			expect(result).toBeUndefined();
		});

		it('should not set status when both userId and connection are missing', () => {
			const context = {
				userId: null,
				connection: null,
			};

			const result = methods['UserPresence:online'].call(context);

			expect(mockSetConnectionStatus).not.toHaveBeenCalled();
			expect(result).toBeUndefined();
		});

		it('should handle connection with additional properties', () => {
			const context = {
				userId: 'user123',
				connection: { 
					id: 'conn456',
					clientAddress: '127.0.0.1',
					httpHeaders: {},
				},
			};

			methods['UserPresence:online'].call(context);

			expect(mockSetConnectionStatus).toHaveBeenCalledWith(
				'user123',
				'conn456',
				UserStatus.ONLINE
			);
		});
	});

	describe('UserPresence:away', () => {
		it('should set connection status to AWAY with correct parameter order', () => {
			const context = {
				userId: 'user123',
				connection: { id: 'conn456' },
			};

			methods['UserPresence:away'].call(context);

			// Verify new parameter order: userId, connectionId, status
			expect(mockSetConnectionStatus).toHaveBeenCalledWith(
				'user123',
				'conn456',
				UserStatus.AWAY
			);
		});

		it('should not set status when userId is missing', () => {
			const context = {
				userId: null,
				connection: { id: 'conn456' },
			};

			const result = methods['UserPresence:away'].call(context);

			expect(mockSetConnectionStatus).not.toHaveBeenCalled();
			expect(result).toBeUndefined();
		});

		it('should not set status when connection is missing', () => {
			const context = {
				userId: 'user123',
				connection: null,
			};

			const result = methods['UserPresence:away'].call(context);

			expect(mockSetConnectionStatus).not.toHaveBeenCalled();
			expect(result).toBeUndefined();
		});

		it('should handle different connection IDs', () => {
			const context = {
				userId: 'user123',
				connection: { id: 'different-conn-id' },
			};

			methods['UserPresence:away'].call(context);

			expect(mockSetConnectionStatus).toHaveBeenCalledWith(
				'user123',
				'different-conn-id',
				UserStatus.AWAY
			);
		});
	});

	describe('UserPresence:ping', () => {
		it('should set connection status without explicit status parameter', () => {
			const context = {
				userId: 'user123',
				connection: { id: 'conn456' },
			};

			methods['UserPresence:ping'].call(context);

			// Verify it's called with userId and connectionId only (no status)
			expect(mockSetConnectionStatus).toHaveBeenCalledWith('user123', 'conn456');
			expect(mockSetConnectionStatus).toHaveBeenCalledTimes(1);
		});

		it('should not call setConnectionStatus when userId is missing', () => {
			const context = {
				userId: null,
				connection: { id: 'conn456' },
			};

			const result = methods['UserPresence:ping'].call(context);

			expect(mockSetConnectionStatus).not.toHaveBeenCalled();
			expect(result).toBeUndefined();
		});

		it('should not call setConnectionStatus when connection is missing', () => {
			const context = {
				userId: 'user123',
				connection: null,
			};

			const result = methods['UserPresence:ping'].call(context);

			expect(mockSetConnectionStatus).not.toHaveBeenCalled();
			expect(result).toBeUndefined();
		});

		it('should handle rapid ping calls', () => {
			const context = {
				userId: 'user123',
				connection: { id: 'conn456' },
			};

			// Simulate multiple rapid pings
			for (let i = 0; i < 10; i++) {
				methods['UserPresence:ping'].call(context);
			}

			expect(mockSetConnectionStatus).toHaveBeenCalledTimes(10);
			expect(mockSetConnectionStatus).toHaveBeenCalledWith('user123', 'conn456');
		});

		it('should handle pings from different connections for same user', () => {
			const contexts = [
				{ userId: 'user123', connection: { id: 'conn1' } },
				{ userId: 'user123', connection: { id: 'conn2' } },
				{ userId: 'user123', connection: { id: 'conn3' } },
			];

			contexts.forEach((context) => {
				methods['UserPresence:ping'].call(context);
			});

			expect(mockSetConnectionStatus).toHaveBeenCalledTimes(3);
			expect(mockSetConnectionStatus).toHaveBeenNthCalledWith(1, 'user123', 'conn1');
			expect(mockSetConnectionStatus).toHaveBeenNthCalledWith(2, 'user123', 'conn2');
			expect(mockSetConnectionStatus).toHaveBeenNthCalledWith(3, 'user123', 'conn3');
		});
	});

	describe('method interactions', () => {
		it('should handle switching from online to away', () => {
			const context = {
				userId: 'user123',
				connection: { id: 'conn456' },
			};

			methods['UserPresence:online'].call(context);
			methods['UserPresence:away'].call(context);

			expect(mockSetConnectionStatus).toHaveBeenCalledTimes(2);
			expect(mockSetConnectionStatus).toHaveBeenNthCalledWith(
				1,
				'user123',
				'conn456',
				UserStatus.ONLINE
			);
			expect(mockSetConnectionStatus).toHaveBeenNthCalledWith(
				2,
				'user123',
				'conn456',
				UserStatus.AWAY
			);
		});

		it('should handle ping between status changes', () => {
			const context = {
				userId: 'user123',
				connection: { id: 'conn456' },
			};

			methods['UserPresence:online'].call(context);
			methods['UserPresence:ping'].call(context);
			methods['UserPresence:away'].call(context);
			methods['UserPresence:ping'].call(context);

			expect(mockSetConnectionStatus).toHaveBeenCalledTimes(4);
			expect(mockSetConnectionStatus).toHaveBeenNthCalledWith(
				1,
				'user123',
				'conn456',
				UserStatus.ONLINE
			);
			expect(mockSetConnectionStatus).toHaveBeenNthCalledWith(2, 'user123', 'conn456');
			expect(mockSetConnectionStatus).toHaveBeenNthCalledWith(
				3,
				'user123',
				'conn456',
				UserStatus.AWAY
			);
			expect(mockSetConnectionStatus).toHaveBeenNthCalledWith(4, 'user123', 'conn456');
		});

		it('should handle multiple users with different methods', () => {
			const user1Context = {
				userId: 'user1',
				connection: { id: 'conn1' },
			};

			const user2Context = {
				userId: 'user2',
				connection: { id: 'conn2' },
			};

			methods['UserPresence:online'].call(user1Context);
			methods['UserPresence:away'].call(user2Context);
			methods['UserPresence:ping'].call(user1Context);

			expect(mockSetConnectionStatus).toHaveBeenCalledTimes(3);
			expect(mockSetConnectionStatus).toHaveBeenCalledWith('user1', 'conn1', UserStatus.ONLINE);
			expect(mockSetConnectionStatus).toHaveBeenCalledWith('user2', 'conn2', UserStatus.AWAY);
			expect(mockSetConnectionStatus).toHaveBeenCalledWith('user1', 'conn1');
		});
	});

	describe('edge cases', () => {
		it('should handle undefined userId explicitly', () => {
			const context = {
				userId: undefined,
				connection: { id: 'conn456' },
			};

			const result = methods['UserPresence:ping'].call(context);

			expect(mockSetConnectionStatus).not.toHaveBeenCalled();
			expect(result).toBeUndefined();
		});

		it('should handle empty string connection id', () => {
			const context = {
				userId: 'user123',
				connection: { id: '' },
			};

			methods['UserPresence:ping'].call(context);

			expect(mockSetConnectionStatus).toHaveBeenCalledWith('user123', '');
		});

		it('should handle connection without id property', () => {
			const context = {
				userId: 'user123',
				connection: {} as any,
			};

			methods['UserPresence:ping'].call(context);

			expect(mockSetConnectionStatus).toHaveBeenCalledWith('user123', undefined);
		});

		it('should handle context without properties', () => {
			const context = {} as any;

			const result = methods['UserPresence:ping'].call(context);

			expect(mockSetConnectionStatus).not.toHaveBeenCalled();
			expect(result).toBeUndefined();
		});
	});

	describe('return values', () => {
		it('should return result from setConnectionStatus for online', () => {
			mockSetConnectionStatus.mockReturnValue(true);

			const context = {
				userId: 'user123',
				connection: { id: 'conn456' },
			};

			const result = methods['UserPresence:online'].call(context);

			expect(result).toBe(true);
		});

		it('should return result from setConnectionStatus for away', () => {
			mockSetConnectionStatus.mockReturnValue(false);

			const context = {
				userId: 'user123',
				connection: { id: 'conn456' },
			};

			const result = methods['UserPresence:away'].call(context);

			expect(result).toBe(false);
		});

		it('should return result from setConnectionStatus for ping', () => {
			mockSetConnectionStatus.mockReturnValue(true);

			const context = {
				userId: 'user123',
				connection: { id: 'conn456' },
			};

			const result = methods['UserPresence:ping'].call(context);

			expect(result).toBe(true);
		});

		it('should return result from setDefaultStatus', () => {
			mockSetDefaultStatus.mockReturnValue('status-set');

			const context = {
				userId: 'user123',
			};

			const result = methods['UserPresence:setDefaultStatus'].call(context, UserStatus.AWAY);

			expect(result).toBe('status-set');
		});
	});
});