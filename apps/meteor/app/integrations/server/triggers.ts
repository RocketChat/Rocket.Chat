import { callbacks } from '../../../lib/callbacks';
import { afterLeaveRoomCallback } from '../../../lib/callbacks/afterLeaveRoomCallback';
import { triggerHandler } from './lib/triggerHandler';

const callbackHandler = function _callbackHandler(eventType: string) {
	return function _wrapperFunction(...args: any[]) {
		return triggerHandler.executeTriggers(eventType, ...args);
	};
};

callbacks.add('afterSaveMessage', callbackHandler('sendMessage'), callbacks.priority.LOW, 'integrations-sendMessage');
callbacks.add('afterCreateChannel', callbackHandler('roomCreated'), callbacks.priority.LOW, 'integrations-roomCreated');
callbacks.add('afterCreatePrivateGroup', callbackHandler('roomCreated'), callbacks.priority.LOW, 'integrations-roomCreated');
callbacks.add('afterCreateUser', callbackHandler('userCreated'), callbacks.priority.LOW, 'integrations-userCreated');
callbacks.add('afterJoinRoom', callbackHandler('roomJoined'), callbacks.priority.LOW, 'integrations-roomJoined');
afterLeaveRoomCallback.add(callbackHandler('roomLeft'), callbacks.priority.LOW, 'integrations-roomLeft');
callbacks.add('afterRoomArchived', callbackHandler('roomArchived'), callbacks.priority.LOW, 'integrations-roomArchived');
callbacks.add('afterFileUpload', callbackHandler('fileUploaded'), callbacks.priority.LOW, 'integrations-fileUploaded');
