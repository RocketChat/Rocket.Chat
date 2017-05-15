const callbackHandler = function _callbackHandler(eventType) {
	return function _wrapperFunction() {
		return RocketChat.integrations.triggerHandler.executeTriggers(eventType, ...arguments);
	};
};

RocketChat.callbacks.add('afterSaveMessage', callbackHandler('sendMessage'), RocketChat.callbacks.priority.LOW);
RocketChat.callbacks.add('afterCreateChannel', callbackHandler('roomCreated'), RocketChat.callbacks.priority.LOW);
RocketChat.callbacks.add('afterCreatePrivateGroup', callbackHandler('roomCreated'), RocketChat.callbacks.priority.LOW);
RocketChat.callbacks.add('afterCreateUser', callbackHandler('userCreated'), RocketChat.callbacks.priority.LOW);
RocketChat.callbacks.add('afterJoinRoom', callbackHandler('roomJoined'), RocketChat.callbacks.priority.LOW);
RocketChat.callbacks.add('afterLeaveRoom', callbackHandler('roomLeft'), RocketChat.callbacks.priority.LOW);
RocketChat.callbacks.add('afterRoomArchived', callbackHandler('roomArchived'), RocketChat.callbacks.priority.LOW);
RocketChat.callbacks.add('afterFileUpload', callbackHandler('fileUploaded'), RocketChat.callbacks.priority.LOW);
