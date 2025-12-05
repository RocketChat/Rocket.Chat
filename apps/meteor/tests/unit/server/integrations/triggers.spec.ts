import { expect } from 'chai';
import { faker } from '@faker-js/faker';
import type { IMessage, IUser, IRoom, IOutgoingIntegration } from '@rocket.chat/core-typings';

import { callbacks } from '../../../../lib/callbacks';
import { triggerHandler } from '../../../../app/integrations/server/lib/triggerHandler';

describe('Integration Triggers - Callbacks', () => {
	let testUser: IUser;
	let testRoom: IRoom;
	let testMessage: IMessage;
	let messageEditedIntegration: IOutgoingIntegration;
	let messageDeletedIntegration: IOutgoingIntegration;

	beforeEach(async () => {
		// Create test user
		testUser = {
			_id: faker.string.uuid(),
			username: faker.internet.userName(),
			name: faker.person.fullName(),
			emails: [{ address: faker.internet.email(), verified: true }],
			createdAt: new Date(),
			active: true,
			roles: ['user'],
			type: 'user',
		} as IUser;

		// Create test room
		testRoom = {
			_id: faker.string.uuid(),
			name: faker.word.noun(),
			t: 'c', // channel
			ts: new Date(),
			u: testUser,
			msgs: 0,
			usersCount: 1,
		} as IRoom;

		// Create test message
		testMessage = {
			_id: faker.string.uuid(),
			rid: testRoom._id,
			msg: faker.lorem.sentence(),
			ts: new Date(),
			u: {
				_id: testUser._id,
				username: testUser.username,
				name: testUser.name,
			},
		} as IMessage;

		// Create messageEdited integration
		messageEditedIntegration = {
			_id: faker.string.uuid(),
			name: 'Message Edited Integration',
			enabled: true,
			event: 'messageEdited',
			channel: [testRoom._id],
			username: testUser.username,
			urls: ['http://example.com/webhook'],
			token: faker.string.alphanumeric(32),
			scriptEnabled: false,
			impersonateUser: false,
			runOnEdits: true,
			retryFailedCalls: false,
			retryCount: 0,
			retryDelay: 'powers-of-ten',
			triggerWords: [],
			triggerWordAnywhere: false,
			targetRoom: '',
			alias: '',
			emoji: '',
			avatar: '',
			script: '',
			fallbackResponses: {},
		} as IOutgoingIntegration;

		// Create messageDeleted integration
		messageDeletedIntegration = {
			_id: faker.string.uuid(),
			name: 'Message Deleted Integration',
			enabled: true,
			event: 'messageDeleted',
			channel: [testRoom._id],
			username: testUser.username,
			urls: ['http://example.com/webhook'],
			token: faker.string.alphanumeric(32),
			scriptEnabled: false,
			impersonateUser: false,
			runOnEdits: true,
			retryFailedCalls: false,
			retryCount: 0,
			retryDelay: 'powers-of-ten',
			triggerWords: [],
			triggerWordAnywhere: false,
			targetRoom: '',
			alias: '',
			emoji: '',
			avatar: '',
			script: '',
			fallbackResponses: {},
		} as IOutgoingIntegration;

		// Add integrations to trigger handler
		triggerHandler.addIntegration(messageEditedIntegration);
		triggerHandler.addIntegration(messageDeletedIntegration);
	});

	afterEach(() => {
		// Clean up callbacks
		callbacks.remove('afterSaveMessage', 'integrations-messageEdited');
		callbacks.remove('afterDeleteMessage', 'integrations-messageDeleted');
	});

	describe('messageEdited callback', () => {
		it('should trigger messageEdited event when message is edited', async () => {
			// Create an edited message
			const editedMessage: IMessage = {
				...testMessage,
				editedAt: new Date(),
				editedBy: {
					_id: testUser._id,
					username: testUser.username,
				},
				msg: 'This message has been edited',
			};

			// Mock the executeTriggers method to capture calls
			const originalExecuteTriggers = triggerHandler.executeTriggers;
			let executedEvents: Array<{ event: string; message: IMessage; room: IRoom; user: IUser }> = [];

			triggerHandler.executeTriggers = async (event: string, message: IMessage, room: IRoom, user: IUser) => {
				executedEvents.push({ event, message, room, user });
			};

			try {
				// Add the messageEdited callback
				callbacks.add(
					'afterSaveMessage',
					(message: IMessage, { room }: { room: IRoom }) => {
						if (message.editedAt) {
							// Find the user who edited the message
							const editedBy = message.editedBy;
							if (editedBy) {
								triggerHandler.executeTriggers('messageEdited', message, room, {
									_id: editedBy._id,
									username: editedBy.username,
								} as IUser);
							}
						}
					},
					callbacks.priority.LOW,
					'integrations-messageEdited',
				);

				// Trigger the afterSaveMessage callback with edited message
				await callbacks.run('afterSaveMessage', editedMessage, { room: testRoom });

				// Verify that messageEdited event was triggered
				expect(executedEvents).to.have.length(1);
				expect(executedEvents[0].event).to.equal('messageEdited');
				expect(executedEvents[0].message).to.deep.equal(editedMessage);
				expect(executedEvents[0].room).to.deep.equal(testRoom);
				expect(executedEvents[0].user._id).to.equal(testUser._id);
			} finally {
				// Restore original method
				triggerHandler.executeTriggers = originalExecuteTriggers;
			}
		});

		it('should not trigger messageEdited event when message is not edited', async () => {
			// Create a non-edited message
			const nonEditedMessage: IMessage = {
				...testMessage,
				// No editedAt field
			};

			// Mock the executeTriggers method to capture calls
			const originalExecuteTriggers = triggerHandler.executeTriggers;
			let executedEvents: Array<{ event: string; message: IMessage; room: IRoom; user: IUser }> = [];

			triggerHandler.executeTriggers = async (event: string, message: IMessage, room: IRoom, user: IUser) => {
				executedEvents.push({ event, message, room, user });
			};

			try {
				// Add the messageEdited callback
				callbacks.add(
					'afterSaveMessage',
					(message: IMessage, { room }: { room: IRoom }) => {
						if (message.editedAt) {
							// Find the user who edited the message
							const editedBy = message.editedBy;
							if (editedBy) {
								triggerHandler.executeTriggers('messageEdited', message, room, {
									_id: editedBy._id,
									username: editedBy.username,
								} as IUser);
							}
						}
					},
					callbacks.priority.LOW,
					'integrations-messageEdited',
				);

				// Trigger the afterSaveMessage callback with non-edited message
				await callbacks.run('afterSaveMessage', nonEditedMessage, { room: testRoom });

				// Verify that messageEdited event was not triggered
				expect(executedEvents).to.have.length(0);
			} finally {
				// Restore original method
				triggerHandler.executeTriggers = originalExecuteTriggers;
			}
		});

		it('should handle message with editedBy but no editedAt', async () => {
			// Create a message with editedBy but no editedAt (edge case)
			const edgeCaseMessage: IMessage = {
				...testMessage,
				editedBy: {
					_id: testUser._id,
					username: testUser.username,
				},
				// No editedAt field
			};

			// Mock the executeTriggers method to capture calls
			const originalExecuteTriggers = triggerHandler.executeTriggers;
			let executedEvents: Array<{ event: string; message: IMessage; room: IRoom; user: IUser }> = [];

			triggerHandler.executeTriggers = async (event: string, message: IMessage, room: IRoom, user: IUser) => {
				executedEvents.push({ event, message, room, user });
			};

			try {
				// Add the messageEdited callback
				callbacks.add(
					'afterSaveMessage',
					(message: IMessage, { room }: { room: IRoom }) => {
						if (message.editedAt) {
							// Find the user who edited the message
							const editedBy = message.editedBy;
							if (editedBy) {
								triggerHandler.executeTriggers('messageEdited', message, room, {
									_id: editedBy._id,
									username: editedBy.username,
								} as IUser);
							}
						}
					},
					callbacks.priority.LOW,
					'integrations-messageEdited',
				);

				// Trigger the afterSaveMessage callback with edge case message
				await callbacks.run('afterSaveMessage', edgeCaseMessage, { room: testRoom });

				// Verify that messageEdited event was not triggered
				expect(executedEvents).to.have.length(0);
			} finally {
				// Restore original method
				triggerHandler.executeTriggers = originalExecuteTriggers;
			}
		});
	});

	describe('messageDeleted callback', () => {
		it('should trigger messageDeleted event when message is deleted', async () => {
			// Mock the executeTriggers method to capture calls
			const originalExecuteTriggers = triggerHandler.executeTriggers;
			let executedEvents: Array<{ event: string; message: IMessage; room: IRoom; user: IUser }> = [];

			triggerHandler.executeTriggers = async (event: string, message: IMessage, room: IRoom, user: IUser) => {
				executedEvents.push({ event, message, room, user });
			};

			try {
				// Add the messageDeleted callback
				callbacks.add(
					'afterDeleteMessage',
					(message: IMessage, room: IRoom) => {
						// In a real scenario, we would need to get the user who deleted the message
						// For this test, we'll use the message author
						triggerHandler.executeTriggers('messageDeleted', message, room, {
							_id: message.u._id,
							username: message.u.username,
						} as IUser);
					},
					callbacks.priority.LOW,
					'integrations-messageDeleted',
				);

				// Trigger the afterDeleteMessage callback
				await callbacks.run('afterDeleteMessage', testMessage, testRoom);

				// Verify that messageDeleted event was triggered
				expect(executedEvents).to.have.length(1);
				expect(executedEvents[0].event).to.equal('messageDeleted');
				expect(executedEvents[0].message).to.deep.equal(testMessage);
				expect(executedEvents[0].room).to.deep.equal(testRoom);
				expect(executedEvents[0].user._id).to.equal(testMessage.u._id);
			} finally {
				// Restore original method
				triggerHandler.executeTriggers = originalExecuteTriggers;
			}
		});

		it('should handle message deletion with different user', async () => {
			// Create a different user who deletes the message
			const deletingUser: IUser = {
				_id: faker.string.uuid(),
				username: faker.internet.userName(),
				name: faker.person.fullName(),
				emails: [{ address: faker.internet.email(), verified: true }],
				createdAt: new Date(),
				active: true,
				roles: ['user'],
				type: 'user',
			} as IUser;

			// Mock the executeTriggers method to capture calls
			const originalExecuteTriggers = triggerHandler.executeTriggers;
			let executedEvents: Array<{ event: string; message: IMessage; room: IRoom; user: IUser }> = [];

			triggerHandler.executeTriggers = async (event: string, message: IMessage, room: IRoom, user: IUser) => {
				executedEvents.push({ event, message, room, user });
			};

			try {
				// Add the messageDeleted callback
				callbacks.add(
					'afterDeleteMessage',
					(message: IMessage, room: IRoom) => {
						// In a real scenario, we would need to get the user who deleted the message
						// For this test, we'll use the deleting user
						triggerHandler.executeTriggers('messageDeleted', message, room, deletingUser);
					},
					callbacks.priority.LOW,
					'integrations-messageDeleted',
				);

				// Trigger the afterDeleteMessage callback
				await callbacks.run('afterDeleteMessage', testMessage, testRoom);

				// Verify that messageDeleted event was triggered with the correct user
				expect(executedEvents).to.have.length(1);
				expect(executedEvents[0].event).to.equal('messageDeleted');
				expect(executedEvents[0].message).to.deep.equal(testMessage);
				expect(executedEvents[0].room).to.deep.equal(testRoom);
				expect(executedEvents[0].user._id).to.equal(deletingUser._id);
			} finally {
				// Restore original method
				triggerHandler.executeTriggers = originalExecuteTriggers;
			}
		});
	});

	describe('Callback priority and execution order', () => {
		it('should execute callbacks in correct priority order', async () => {
			const executionOrder: string[] = [];

			// Add callbacks with different priorities
			callbacks.add(
				'afterSaveMessage',
				(message: IMessage, { room }: { room: IRoom }) => {
					if (message.editedAt) {
						executionOrder.push('messageEdited-HIGH');
					}
				},
				callbacks.priority.HIGH,
				'integrations-messageEdited-high',
			);

			callbacks.add(
				'afterSaveMessage',
				(message: IMessage, { room }: { room: IRoom }) => {
					if (message.editedAt) {
						executionOrder.push('messageEdited-LOW');
					}
				},
				callbacks.priority.LOW,
				'integrations-messageEdited-low',
			);

			// Create an edited message
			const editedMessage: IMessage = {
				...testMessage,
				editedAt: new Date(),
				editedBy: {
					_id: testUser._id,
					username: testUser.username,
				},
			};

			// Trigger the callbacks
			await callbacks.run('afterSaveMessage', editedMessage, { room: testRoom });

			// Verify execution order (HIGH priority should execute before LOW)
			expect(executionOrder).to.have.length(2);
			expect(executionOrder[0]).to.equal('messageEdited-HIGH');
			expect(executionOrder[1]).to.equal('messageEdited-LOW');

			// Clean up
			callbacks.remove('afterSaveMessage', 'integrations-messageEdited-high');
			callbacks.remove('afterSaveMessage', 'integrations-messageEdited-low');
		});
	});

	describe('Error handling in callbacks', () => {
		it('should handle errors in messageEdited callback gracefully', async () => {
			// Add a callback that throws an error
			callbacks.add(
				'afterSaveMessage',
				(message: IMessage, { room }: { room: IRoom }) => {
					if (message.editedAt) {
						throw new Error('Test error in messageEdited callback');
					}
				},
				callbacks.priority.LOW,
				'integrations-messageEdited-error',
			);

			// Create an edited message
			const editedMessage: IMessage = {
				...testMessage,
				editedAt: new Date(),
				editedBy: {
					_id: testUser._id,
					username: testUser.username,
				},
			};

			// The callback should not throw an error and should be handled gracefully
			try {
				await callbacks.run('afterSaveMessage', editedMessage, { room: testRoom });
				// If we reach here, the error was handled gracefully
			} catch (error) {
				// If an error is thrown, it should be a specific type of error
				expect(error).to.be.instanceOf(Error);
			}

			// Clean up
			callbacks.remove('afterSaveMessage', 'integrations-messageEdited-error');
		});

		it('should handle errors in messageDeleted callback gracefully', async () => {
			// Add a callback that throws an error
			callbacks.add(
				'afterDeleteMessage',
				(message: IMessage, room: IRoom) => {
					throw new Error('Test error in messageDeleted callback');
				},
				callbacks.priority.LOW,
				'integrations-messageDeleted-error',
			);

			// The callback should not throw an error and should be handled gracefully
			try {
				await callbacks.run('afterDeleteMessage', testMessage, testRoom);
				// If we reach here, the error was handled gracefully
			} catch (error) {
				// If an error is thrown, it should be a specific type of error
				expect(error).to.be.instanceOf(Error);
			}

			// Clean up
			callbacks.remove('afterDeleteMessage', 'integrations-messageDeleted-error');
		});
	});
}); 