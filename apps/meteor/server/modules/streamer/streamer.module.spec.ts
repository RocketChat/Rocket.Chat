import type { IPublication, DDPSubscription, Connection, TransformMessage } from 'meteor/rocketchat:streamer';

import { Streamer } from './streamer.module';
import { SystemLogger } from '../../lib/logger/system';

// Mock SystemLogger
jest.mock('../../lib/logger/system', () => ({
	SystemLogger: {
		error: jest.fn(),
	},
}));

// Concrete test implementation of Streamer
class TestStreamer extends Streamer<'test'> {
	registerPublication(name: string, fn: (eventName: string, options: boolean | { useCollection?: boolean; args?: any }) => Promise<void>): void {
		// Mock implementation - not needed for these tests
	}

	registerMethod(methods: Record<string, (eventName: string, ...args: any[]) => any>): void {
		// Mock implementation - not needed for these tests
	}

	changedPayload(collection: string, id: string, fields: Record<string, any>): string | false {
		return JSON.stringify({ msg: 'changed', collection, id, fields });
	}
}

describe('Streamer.sendToManySubscriptions', () => {
	let streamer: TestStreamer;
	let mockSubscriptions: Set<DDPSubscription>;
	let mockPublication: IPublication;
	let mockSocket: { send: jest.Mock };

	beforeEach(() => {
		// Reset mocks
		jest.clearAllMocks();

		// Create mock socket
		mockSocket = { send: jest.fn() };

		// Create mock publication
		mockPublication = {
			userId: 'user123',
			connection: { id: 'conn1' } as Connection,
			_session: {
				userId: 'user123',
				socket: mockSocket,
			},
			ready: jest.fn(),
			onStop: jest.fn(),
		} as unknown as IPublication;

		// Create streamer instance
		streamer = new TestStreamer('test-stream');
	});

	describe('async error handling', () => {
		it('should await all async permission checks before resolving', async () => {
			const checkOrder: string[] = [];

			// Create subscriptions
			const sub1 = {
				subscription: { ...mockPublication },
				eventName: 'test-event',
			};
			mockSubscriptions = new Set([sub1]);

			// Mock async permission check
			streamer.isEmitAllowed = jest.fn(async () => {
				checkOrder.push('permission-checked');
				await new Promise((resolve) => setTimeout(resolve, 10));
				return true;
			});

			// Call sendToManySubscriptions
			await streamer.sendToManySubscriptions(mockSubscriptions, undefined, 'test-event', [], 'test-message');

			// Verify permission was checked
			expect(streamer.isEmitAllowed).toHaveBeenCalledTimes(1);
			expect(checkOrder).toContain('permission-checked');

			// Verify message was sent after permission check
			expect(mockSocket.send).toHaveBeenCalledWith('test-message');
		});

		it('should handle errors in isEmitAllowed gracefully', async () => {
			const sub1 = {
				subscription: { ...mockPublication },
				eventName: 'test-event',
			};
			mockSubscriptions = new Set([sub1]);

			// Mock permission check that throws
			const testError = new Error('Permission check failed');
			streamer.isEmitAllowed = jest.fn(async () => {
				throw testError;
			});

			// Should not throw
			await expect(streamer.sendToManySubscriptions(mockSubscriptions, undefined, 'test-event', [], 'test-message')).resolves.toBeUndefined();

			// Should log the error
			expect(SystemLogger.error).toHaveBeenCalledWith({
				msg: 'Error sending to subscription',
				streamer: 'test-stream',
				eventName: 'test-event',
				err: testError,
			});

			// Should not send message
			expect(mockSocket.send).not.toHaveBeenCalled();
		});

		it('should continue processing other subscriptions when one fails', async () => {
			const mockSocket2 = { send: jest.fn() };
			const mockPublication2 = {
				...mockPublication,
				userId: 'user456',
				_session: { userId: 'user456', socket: mockSocket2 },
			} as unknown as IPublication;

			const sub1 = {
				subscription: { ...mockPublication },
				eventName: 'test-event',
			};
			const sub2 = {
				subscription: mockPublication2,
				eventName: 'test-event',
			};
			mockSubscriptions = new Set([sub1, sub2]);

			let callCount = 0;
			streamer.isEmitAllowed = jest.fn(async () => {
				callCount++;
				if (callCount === 1) {
					throw new Error('First subscription failed');
				}
				return true;
			});

			await streamer.sendToManySubscriptions(mockSubscriptions, undefined, 'test-event', [], 'test-message');

			// First subscription should fail
			expect(mockSocket.send).not.toHaveBeenCalled();

			// Second subscription should succeed
			expect(mockSocket2.send).toHaveBeenCalledWith('test-message');

			// Error should be logged once
			expect(SystemLogger.error).toHaveBeenCalledTimes(1);
		});
	});

	describe('permission checks', () => {
		it('should not send message when permission is denied', async () => {
			const sub1 = {
				subscription: { ...mockPublication },
				eventName: 'test-event',
			};
			mockSubscriptions = new Set([sub1]);

			streamer.isEmitAllowed = jest.fn(async () => false);

			await streamer.sendToManySubscriptions(mockSubscriptions, undefined, 'test-event', [], 'test-message');

			expect(streamer.isEmitAllowed).toHaveBeenCalledTimes(1);
			expect(mockSocket.send).not.toHaveBeenCalled();
		});

		it('should send message when permission is granted', async () => {
			const sub1 = {
				subscription: { ...mockPublication },
				eventName: 'test-event',
			};
			mockSubscriptions = new Set([sub1]);

			streamer.isEmitAllowed = jest.fn(async () => true);

			await streamer.sendToManySubscriptions(mockSubscriptions, undefined, 'test-event', [], 'test-message');

			expect(streamer.isEmitAllowed).toHaveBeenCalledTimes(1);
			expect(mockSocket.send).toHaveBeenCalledWith('test-message');
		});

		it('should handle permission check returning object (allowed with metadata)', async () => {
			const sub1 = {
				subscription: { ...mockPublication },
				eventName: 'test-event',
			};
			mockSubscriptions = new Set([sub1]);

			const permissionData = { roomParticipant: true, roomType: 'p' };
			streamer.isEmitAllowed = jest.fn(async () => permissionData);

			await streamer.sendToManySubscriptions(mockSubscriptions, undefined, 'test-event', [], 'test-message');

			expect(mockSocket.send).toHaveBeenCalledWith('test-message');
		});
	});

	describe('retransmitToSelf behavior', () => {
		it('should skip origin connection when retransmitToSelf is false', async () => {
			streamer.retransmitToSelf = false;

			const originConnection = { id: 'origin-conn' } as Connection;
			const sub1 = {
				subscription: {
					...mockPublication,
					connection: originConnection,
				},
				eventName: 'test-event',
			};
			mockSubscriptions = new Set([sub1]);

			streamer.isEmitAllowed = jest.fn(async () => true);

			await streamer.sendToManySubscriptions(mockSubscriptions, originConnection, 'test-event', [], 'test-message');

			// Should not check permissions or send
			expect(streamer.isEmitAllowed).not.toHaveBeenCalled();
			expect(mockSocket.send).not.toHaveBeenCalled();
		});

		it('should include origin connection when retransmitToSelf is true', async () => {
			streamer.retransmitToSelf = true;

			const originConnection = { id: 'origin-conn' } as Connection;
			const sub1 = {
				subscription: {
					...mockPublication,
					connection: originConnection,
				},
				eventName: 'test-event',
			};
			mockSubscriptions = new Set([sub1]);

			streamer.isEmitAllowed = jest.fn(async () => true);

			await streamer.sendToManySubscriptions(mockSubscriptions, originConnection, 'test-event', [], 'test-message');

			expect(streamer.isEmitAllowed).toHaveBeenCalledTimes(1);
			expect(mockSocket.send).toHaveBeenCalledWith('test-message');
		});

		it('should send to non-origin subscriptions even when origin is skipped', async () => {
			streamer.retransmitToSelf = false;

			const originConnection = { id: 'origin-conn' } as Connection;
			const otherConnection = { id: 'other-conn' } as Connection;

			const mockSocket2 = { send: jest.fn() };
			const mockPublication2 = {
				...mockPublication,
				connection: otherConnection,
				_session: { ...mockPublication._session, socket: mockSocket2 },
			} as unknown as IPublication;

			const sub1 = {
				subscription: {
					...mockPublication,
					connection: originConnection,
				},
				eventName: 'test-event',
			};
			const sub2 = {
				subscription: mockPublication2,
				eventName: 'test-event',
			};
			mockSubscriptions = new Set([sub1, sub2]);

			streamer.isEmitAllowed = jest.fn(async () => true);

			await streamer.sendToManySubscriptions(mockSubscriptions, originConnection, 'test-event', [], 'test-message');

			// Should only check/send to non-origin subscription
			expect(streamer.isEmitAllowed).toHaveBeenCalledTimes(1);
			expect(mockSocket.send).not.toHaveBeenCalled();
			expect(mockSocket2.send).toHaveBeenCalledWith('test-message');
		});
	});

	describe('transform function handling', () => {
		it('should use string message directly', async () => {
			const sub1 = {
				subscription: { ...mockPublication },
				eventName: 'test-event',
			};
			mockSubscriptions = new Set([sub1]);

			streamer.isEmitAllowed = jest.fn(async () => true);

			await streamer.sendToManySubscriptions(mockSubscriptions, undefined, 'test-event', [], 'direct-string-message');

			expect(mockSocket.send).toHaveBeenCalledWith('direct-string-message');
		});

		it('should call transform function when provided', async () => {
			const sub1 = {
				subscription: { ...mockPublication },
				eventName: 'test-event',
			};
			mockSubscriptions = new Set([sub1]);

			const permissionData = { roomParticipant: true };
			streamer.isEmitAllowed = jest.fn(async () => permissionData);

			const transformFn: TransformMessage = jest.fn((streamer, subscription, eventName, args, allowed) => {
				return `transformed:${eventName}:${JSON.stringify(allowed)}`;
			});

			await streamer.sendToManySubscriptions(mockSubscriptions, undefined, 'test-event', ['arg1'], transformFn);

			expect(transformFn).toHaveBeenCalledWith(streamer, sub1, 'test-event', ['arg1'], permissionData);
			expect(mockSocket.send).toHaveBeenCalledWith(`transformed:test-event:${JSON.stringify(permissionData)}`);
		});

		it('should not send if transform function returns empty string', async () => {
			const sub1 = {
				subscription: { ...mockPublication },
				eventName: 'test-event',
			};
			mockSubscriptions = new Set([sub1]);

			streamer.isEmitAllowed = jest.fn(async () => true);

			const transformFn: TransformMessage = jest.fn(() => '');

			await streamer.sendToManySubscriptions(mockSubscriptions, undefined, 'test-event', [], transformFn);

			expect(transformFn).toHaveBeenCalled();
			expect(mockSocket.send).not.toHaveBeenCalled();
		});

		it('should not send if transform function returns false', async () => {
			const sub1 = {
				subscription: { ...mockPublication },
				eventName: 'test-event',
			};
			mockSubscriptions = new Set([sub1]);

			streamer.isEmitAllowed = jest.fn(async () => true);

			const transformFn: TransformMessage = jest.fn(() => false);

			await streamer.sendToManySubscriptions(mockSubscriptions, undefined, 'test-event', [], transformFn);

			expect(transformFn).toHaveBeenCalled();
			expect(mockSocket.send).not.toHaveBeenCalled();
		});
	});

	describe('edge cases', () => {
		it('should handle empty subscription set', async () => {
			mockSubscriptions = new Set([]);

			streamer.isEmitAllowed = jest.fn(async () => true);

			await expect(streamer.sendToManySubscriptions(mockSubscriptions, undefined, 'test-event', [], 'test-message')).resolves.toBeUndefined();

			expect(streamer.isEmitAllowed).not.toHaveBeenCalled();
			expect(mockSocket.send).not.toHaveBeenCalled();
		});

		it('should handle null socket gracefully', async () => {
			const mockPublicationNoSocket = {
				...mockPublication,
				_session: {
					userId: 'user123',
					socket: null,
				},
			} as unknown as IPublication;

			const sub1 = {
				subscription: mockPublicationNoSocket,
				eventName: 'test-event',
			};
			mockSubscriptions = new Set([sub1]);

			streamer.isEmitAllowed = jest.fn(async () => true);

			// Should not throw
			await expect(streamer.sendToManySubscriptions(mockSubscriptions, undefined, 'test-event', [], 'test-message')).resolves.toBeUndefined();

			expect(streamer.isEmitAllowed).toHaveBeenCalled();
			// send should not be called on null socket
		});

		it('should handle undefined socket gracefully', async () => {
			const mockPublicationNoSocket = {
				...mockPublication,
				_session: {
					userId: 'user123',
					socket: undefined,
				},
			} as unknown as IPublication;

			const sub1 = {
				subscription: mockPublicationNoSocket,
				eventName: 'test-event',
			};
			mockSubscriptions = new Set([sub1]);

			streamer.isEmitAllowed = jest.fn(async () => true);

			await expect(streamer.sendToManySubscriptions(mockSubscriptions, undefined, 'test-event', [], 'test-message')).resolves.toBeUndefined();

			expect(streamer.isEmitAllowed).toHaveBeenCalled();
		});

		it('should process multiple subscriptions in order', async () => {
			const sendOrder: number[] = [];

			const mockSocket1 = {
				send: jest.fn(() => sendOrder.push(1)),
			};
			const mockSocket2 = {
				send: jest.fn(() => sendOrder.push(2)),
			};
			const mockSocket3 = {
				send: jest.fn(() => sendOrder.push(3)),
			};

			const mockPub1 = { ...mockPublication, _session: { ...mockPublication._session, socket: mockSocket1 } } as unknown as IPublication;
			const mockPub2 = {
				...mockPublication,
				userId: 'user2',
				_session: { userId: 'user2', socket: mockSocket2 },
			} as unknown as IPublication;
			const mockPub3 = {
				...mockPublication,
				userId: 'user3',
				_session: { userId: 'user3', socket: mockSocket3 },
			} as unknown as IPublication;

			const sub1 = { subscription: mockPub1, eventName: 'test' };
			const sub2 = { subscription: mockPub2, eventName: 'test' };
			const sub3 = { subscription: mockPub3, eventName: 'test' };

			mockSubscriptions = new Set([sub1, sub2, sub3]);

			streamer.isEmitAllowed = jest.fn(async () => true);

			await streamer.sendToManySubscriptions(mockSubscriptions, undefined, 'test-event', [], 'test-message');

			// Verify all were sent
			expect(mockSocket1.send).toHaveBeenCalledWith('test-message');
			expect(mockSocket2.send).toHaveBeenCalledWith('test-message');
			expect(mockSocket3.send).toHaveBeenCalledWith('test-message');

			// Verify sequential processing (order should be 1, 2, 3)
			expect(sendOrder).toEqual([1, 2, 3]);
		});
	});
});
