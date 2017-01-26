const callbackHandlers = {
	message: function _messageCallBackHandler() {
		return RocketChat.integrations.triggerHandler.executeTriggers(...arguments);
	},
	room: function _roomCallBackHandler() {
		return undefined;
	}
};

RocketChat.callbacks.add('afterSaveMessage', callbackHandlers['message'], RocketChat.callbacks.priority.LOW);
