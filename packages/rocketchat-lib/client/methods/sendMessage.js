Meteor.methods({
	sendMessage(message) {
		if (!Meteor.userId() || _.trim(message.msg) === '') {
			return false;
		}
		message.ts = isNaN(TimeSync.serverOffset()) ? new Date() : new Date(Date.now() + TimeSync.serverOffset());
		message.u = {
			_id: Meteor.userId(),
			username: Meteor.user().username
		};
		message.temp = true;
		message = RocketChat.callbacks.run('beforeSaveMessage', message);
		RocketChat.promises.run('onClientMessageReceived', message).then(function(message) {
			ChatMessage.insert(message);
			return RocketChat.callbacks.run('afterSaveMessage', message);
		});
	}
});
