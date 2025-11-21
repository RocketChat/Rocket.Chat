import { triggerHandler } from './lib/triggerHandler';
import { callbacks } from '../../../lib/callbacks';
import { afterLeaveRoomCallback } from '../../../lib/callbacks/afterLeaveRoomCallback';
import type { IMessage } from '@rocket.chat/core-typings';

const callbackHandler = function _callbackHandler(eventType: string) {
	return function _wrapperFunction(...args: any[]) {
		return triggerHandler.executeTriggers(eventType, ...args);
	};
};

callbacks.add(
	'afterSaveMessage',
	(message: IMessage & { editedAt?: Date; editedBy?: { _id: string; username: string } }, { room }) => {
		// Handle sendMessage event for new messages
		callbackHandler('sendMessage')(message, room);
		
		// Handle messageEdited event for edited messages
		if (message.editedAt && message.editedBy) {
			callbackHandler('messageEdited')(message, room, {
				_id: message.editedBy._id,
				username: message.editedBy.username,
			});
		}
	},
	callbacks.priority.LOW,
	'integrations-sendMessage',
);

callbacks.add('afterCreateChannel', callbackHandler('roomCreated'), callbacks.priority.LOW, 'integrations-roomCreated');
callbacks.add('afterCreatePrivateGroup', callbackHandler('roomCreated'), callbacks.priority.LOW, 'integrations-roomCreated');
callbacks.add('afterCreateUser', callbackHandler('userCreated'), callbacks.priority.LOW, 'integrations-userCreated');
callbacks.add('afterJoinRoom', callbackHandler('roomJoined'), callbacks.priority.LOW, 'integrations-roomJoined');
afterLeaveRoomCallback.add(callbackHandler('roomLeft'), callbacks.priority.LOW, 'integrations-roomLeft');
callbacks.add('afterRoomArchived', callbackHandler('roomArchived'), callbacks.priority.LOW, 'integrations-roomArchived');
callbacks.add('afterFileUpload', callbackHandler('fileUploaded'), callbacks.priority.LOW, 'integrations-fileUploaded');

// Add callback for messageDeleted event
callbacks.add(
	'afterDeleteMessage',
	(message, room) => {
		// In a real scenario, we would need to get the user who deleted the message
		// For now, we'll use the message author as a fallback
		callbackHandler('messageDeleted')(message, room, {
			_id: message.u._id,
			username: message.u.username,
		});
	},
	callbacks.priority.LOW,
	'integrations-messageDeleted',
);
