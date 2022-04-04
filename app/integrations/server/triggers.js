import { callbacks } from '../../../lib/callbacks';
import { triggerHandler } from './lib/triggerHandler';

const callbackHandler = function _callbackHandler(eventType) {
	return function _wrapperFunction(...args) {
		return triggerHandler.executeTriggers(eventType, ...args);
	};
};

callbacks.add('afterSaveMessage', callbackHandler('sendMessage'), callbacks.priority.LOW, 'integrations-sendMessage');
callbacks.add('afterCreateChannel', callbackHandler('roomCreated'), callbacks.priority.LOW, 'integrations-roomCreated');
callbacks.add('afterCreatePrivateGroup', callbackHandler('roomCreated'), callbacks.priority.LOW, 'integrations-roomCreated');
callbacks.add('afterCreateUser', callbackHandler('userCreated'), callbacks.priority.LOW, 'integrations-userCreated');
callbacks.add('afterJoinRoom', callbackHandler('roomJoined'), callbacks.priority.LOW, 'integrations-roomJoined');
callbacks.add('afterLeaveRoom', callbackHandler('roomLeft'), callbacks.priority.LOW, 'integrations-roomLeft');
callbacks.add('afterRoomArchived', callbackHandler('roomArchived'), callbacks.priority.LOW, 'integrations-roomArchived');
callbacks.add('afterFileUpload', callbackHandler('fileUploaded'), callbacks.priority.LOW, 'integrations-fileUploaded');
