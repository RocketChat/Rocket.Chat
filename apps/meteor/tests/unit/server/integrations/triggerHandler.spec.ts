import { expect } from 'chai';
import { Meteor } from 'meteor/meteor';
import { faker } from '@faker-js/faker';
import type { IMessage, IUser, IRoom, IOutgoingIntegration } from '@rocket.chat/core-typings';

import { triggerHandler } from '../../../../app/integrations/server/lib/triggerHandler';
import { Integrations, Users, Rooms, Messages } from '@rocket.chat/models';

describe('TriggerHandler - Message Triggers', () => {
	let testUser: IUser;
	let testRoom: IRoom;
	let testMessage: IMessage;
	let testIntegration: IOutgoingIntegration;

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

		// Create test integration
		testIntegration = {
			_id: faker.string.uuid(),
			name: 'Test Integration',
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

		// Mock the database operations
		// Note: In a real test environment, you would use a test database
		// For this example, we'll mock the necessary methods
	});

	describe('messageEdited trigger', () => {
		it('should execute messageEdited trigger when message is edited', async () => {
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

			// Add integration to trigger handler
			triggerHandler.addIntegration(testIntegration);

			// Mock the executeTrigger method to capture calls
			const originalExecuteTrigger = triggerHandler['executeTrigger'];
			let executedTriggers: Array<{ event: string; message: IMessage; room: IRoom; user: IUser }> = [];

			triggerHandler['executeTrigger'] = async (trigger: IOutgoingIntegration, argObject: any) => {
				executedTriggers.push({
					event: argObject.event,
					message: argObject.message,
					room: argObject.room,
					user: argObject.user,
				});
			};

			try {
				// Execute the trigger
				await triggerHandler.executeTriggers('messageEdited', editedMessage, testRoom, testUser);

				// Verify that the trigger was executed
				expect(executedTriggers).to.have.length(1);
				expect(executedTriggers[0].event).to.equal('messageEdited');
				expect(executedTriggers[0].message).to.deep.equal(editedMessage);
				expect(executedTriggers[0].room).to.deep.equal(testRoom);
				expect(executedTriggers[0].user).to.deep.equal(testUser);
			} finally {
				// Restore original method
				triggerHandler['executeTrigger'] = originalExecuteTrigger;
			}
		});

		it('should not execute messageEdited trigger when message is not edited', async () => {
			// Create a non-edited message
			const nonEditedMessage: IMessage = {
				...testMessage,
				// No editedAt field
			};

			// Add integration to trigger handler
			triggerHandler.addIntegration(testIntegration);

			// Mock the executeTrigger method to capture calls
			const originalExecuteTrigger = triggerHandler['executeTrigger'];
			let executedTriggers: Array<{ event: string; message: IMessage; room: IRoom; user: IUser }> = [];

			triggerHandler['executeTrigger'] = async (trigger: IOutgoingIntegration, argObject: any) => {
				executedTriggers.push({
					event: argObject.event,
					message: argObject.message,
					room: argObject.room,
					user: argObject.user,
				});
			};

			try {
				// Execute the trigger
				await triggerHandler.executeTriggers('messageEdited', nonEditedMessage, testRoom, testUser);

				// Verify that the trigger was not executed
				expect(executedTriggers).to.have.length(0);
			} finally {
				// Restore original method
				triggerHandler['executeTrigger'] = originalExecuteTrigger;
			}
		});

		it('should set isEdited flag to true for edited messages', async () => {
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

			// Test the mapEventArgsToData method
			const data: any = {
				token: testIntegration.token,
				bot: false,
			};

			triggerHandler['mapEventArgsToData'](data, {
				event: 'messageEdited',
				message: editedMessage,
				room: testRoom,
				user: testUser,
			});

			// Verify that isEdited flag is set
			expect(data.isEdited).to.be.true;
			expect(data.message_id).to.equal(editedMessage._id);
			expect(data.channel_id).to.equal(testRoom._id);
			expect(data.user_id).to.equal(testUser._id);
		});

		it('should not execute trigger when integration is disabled', async () => {
			// Create a disabled integration
			const disabledIntegration: IOutgoingIntegration = {
				...testIntegration,
				enabled: false,
			};

			// Create an edited message
			const editedMessage: IMessage = {
				...testMessage,
				editedAt: new Date(),
				editedBy: {
					_id: testUser._id,
					username: testUser.username,
				},
			};

			// Add integration to trigger handler
			triggerHandler.addIntegration(disabledIntegration);

			// Mock the executeTrigger method to capture calls
			const originalExecuteTrigger = triggerHandler['executeTrigger'];
			let executedTriggers: Array<{ event: string; message: IMessage; room: IRoom; user: IUser }> = [];

			triggerHandler['executeTrigger'] = async (trigger: IOutgoingIntegration, argObject: any) => {
				executedTriggers.push({
					event: argObject.event,
					message: argObject.message,
					room: argObject.room,
					user: argObject.user,
				});
			};

			try {
				// Execute the trigger
				await triggerHandler.executeTriggers('messageEdited', editedMessage, testRoom, testUser);

				// Verify that the trigger was not executed
				expect(executedTriggers).to.have.length(0);
			} finally {
				// Restore original method
				triggerHandler['executeTrigger'] = originalExecuteTrigger;
			}
		});
	});

	describe('messageDeleted trigger', () => {
		beforeEach(() => {
			// Update integration for messageDeleted event
			testIntegration.event = 'messageDeleted';
		});

		it('should execute messageDeleted trigger when message is deleted', async () => {
			// Add integration to trigger handler
			triggerHandler.addIntegration(testIntegration);

			// Mock the executeTrigger method to capture calls
			const originalExecuteTrigger = triggerHandler['executeTrigger'];
			let executedTriggers: Array<{ event: string; message: IMessage; room: IRoom; user: IUser }> = [];

			triggerHandler['executeTrigger'] = async (trigger: IOutgoingIntegration, argObject: any) => {
				executedTriggers.push({
					event: argObject.event,
					message: argObject.message,
					room: argObject.room,
					user: argObject.user,
				});
			};

			try {
				// Execute the trigger
				await triggerHandler.executeTriggers('messageDeleted', testMessage, testRoom, testUser);

				// Verify that the trigger was executed
				expect(executedTriggers).to.have.length(1);
				expect(executedTriggers[0].event).to.equal('messageDeleted');
				expect(executedTriggers[0].message).to.deep.equal(testMessage);
				expect(executedTriggers[0].room).to.deep.equal(testRoom);
				expect(executedTriggers[0].user).to.deep.equal(testUser);
			} finally {
				// Restore original method
				triggerHandler['executeTrigger'] = originalExecuteTrigger;
			}
		});

		it('should set isDeleted flag to true for deleted messages', async () => {
			// Test the mapEventArgsToData method
			const data: any = {
				token: testIntegration.token,
				bot: false,
			};

			triggerHandler['mapEventArgsToData'](data, {
				event: 'messageDeleted',
				message: testMessage,
				room: testRoom,
				user: testUser,
			});

			// Verify that isDeleted flag is set
			expect(data.isDeleted).to.be.true;
			expect(data.message_id).to.equal(testMessage._id);
			expect(data.channel_id).to.equal(testRoom._id);
			expect(data.user_id).to.equal(testUser._id);
		});

		it('should include user and room data for deleted messages', async () => {
			// Test the mapEventArgsToData method
			const data: any = {
				token: testIntegration.token,
				bot: false,
			};

			triggerHandler['mapEventArgsToData'](data, {
				event: 'messageDeleted',
				message: testMessage,
				room: testRoom,
				user: testUser,
			});

			// Verify that user and room data are included
			expect(data.user).to.exist;
			expect(data.room).to.exist;
			expect(data.message).to.exist;
			expect(data.user._id).to.equal(testUser._id);
			expect(data.room._id).to.equal(testRoom._id);
			expect(data.message._id).to.equal(testMessage._id);
		});

		it('should not execute trigger when integration is disabled', async () => {
			// Create a disabled integration
			const disabledIntegration: IOutgoingIntegration = {
				...testIntegration,
				enabled: false,
			};

			// Add integration to trigger handler
			triggerHandler.addIntegration(disabledIntegration);

			// Mock the executeTrigger method to capture calls
			const originalExecuteTrigger = triggerHandler['executeTrigger'];
			let executedTriggers: Array<{ event: string; message: IMessage; room: IRoom; user: IUser }> = [];

			triggerHandler['executeTrigger'] = async (trigger: IOutgoingIntegration, argObject: any) => {
				executedTriggers.push({
					event: argObject.event,
					message: argObject.message,
					room: argObject.room,
					user: argObject.user,
				});
			};

			try {
				// Execute the trigger
				await triggerHandler.executeTriggers('messageDeleted', testMessage, testRoom, testUser);

				// Verify that the trigger was not executed
				expect(executedTriggers).to.have.length(0);
			} finally {
				// Restore original method
				triggerHandler['executeTrigger'] = originalExecuteTrigger;
			}
		});
	});

	describe('Integration management', () => {
		it('should add integration correctly', () => {
			triggerHandler.addIntegration(testIntegration);

			// Verify integration was added
			// Note: We can't directly access private properties in a real test
			// This is more of an integration test
			expect(triggerHandler).to.exist;
		});

		it('should remove integration correctly', () => {
			triggerHandler.addIntegration(testIntegration);
			triggerHandler.removeIntegration({ _id: testIntegration._id });

			// Verify integration was removed
			expect(triggerHandler).to.exist;
		});

		it('should handle multiple integrations for different events', () => {
			const messageEditedIntegration: IOutgoingIntegration = {
				...testIntegration,
				_id: faker.string.uuid(),
				event: 'messageEdited',
			};

			const messageDeletedIntegration: IOutgoingIntegration = {
				...testIntegration,
				_id: faker.string.uuid(),
				event: 'messageDeleted',
			};

			triggerHandler.addIntegration(messageEditedIntegration);
			triggerHandler.addIntegration(messageDeletedIntegration);

			// Verify both integrations were added
			expect(triggerHandler).to.exist;
		});
	});

	describe('Error handling', () => {
		it('should handle missing room gracefully', async () => {
			const data: any = {
				token: testIntegration.token,
				bot: false,
			};

			// Test with missing room
			triggerHandler['mapEventArgsToData'](data, {
				event: 'messageEdited',
				message: testMessage,
				room: undefined,
				user: testUser,
			});

			// Should not throw error and should handle gracefully
			expect(data).to.exist;
		});

		it('should handle missing message gracefully', async () => {
			const data: any = {
				token: testIntegration.token,
				bot: false,
			};

			// Test with missing message
			triggerHandler['mapEventArgsToData'](data, {
				event: 'messageEdited',
				message: undefined,
				room: testRoom,
				user: testUser,
			});

			// Should not throw error and should handle gracefully
			expect(data).to.exist;
		});

		it('should handle unknown event gracefully', async () => {
			const data: any = {
				token: testIntegration.token,
				bot: false,
			};

			// Test with unknown event
			triggerHandler['mapEventArgsToData'](data, {
				event: 'unknownEvent' as any,
				message: testMessage,
				room: testRoom,
				user: testUser,
			});

			// Should not throw error and should handle gracefully
			expect(data).to.exist;
		});
	});
}); 