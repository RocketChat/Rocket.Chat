import { callbacks } from '../../callbacks';
import { integrations } from '../lib/rocketchat';

const callbackHandler = function _callbackHandler(eventType) {
	return function _wrapperFunction(...args) {
		return integrations.triggerHandler.executeTriggers(eventType, ...args);
	};
};

callbacks.add('afterSaveMessage', callbackHandler('sendMessage'), callbacks.priority.LOW);
callbacks.add('afterCreateChannel', callbackHandler('roomCreated'), callbacks.priority.LOW);
callbacks.add('afterCreatePrivateGroup', callbackHandler('roomCreated'), callbacks.priority.LOW);
callbacks.add('afterCreateUser', callbackHandler('userCreated'), callbacks.priority.LOW);
callbacks.add('afterJoinRoom', callbackHandler('roomJoined'), callbacks.priority.LOW);
callbacks.add('afterLeaveRoom', callbackHandler('roomLeft'), callbacks.priority.LOW);
callbacks.add('afterRoomArchived', callbackHandler('roomArchived'), callbacks.priority.LOW);
callbacks.add('afterFileUpload', callbackHandler('fileUploaded'), callbacks.priority.LOW);
