RocketChat.updateMessage = function(message, user) {
	// If we keep history of edits, insert a new message to store history information
	if (RocketChat.settings.get('Message_KeepHistory')) {
		RocketChat.models.Messages.cloneAndSaveAsHistoryById(message._id);
	}

	message.editedAt = new Date();
	message.editedBy = {
		_id: user._id,
		username: user.username
	};

	const urls = message.msg.match(/([A-Za-z]{3,9}):\/\/([-;:&=\+\$,\w]+@{1})?([-A-Za-z0-9\.]+)+:?(\d+)?((\/[-\+=!:~%\/\.@\,\w]*)?\??([-\+=&!:;%@\/\.\,\w]+)?(?:#([^\s\)]+))?)?/g);
	if (urls) {
		message.urls = urls.map((url) => { return { url }; });
	}

	message = RocketChat.callbacks.run('beforeSaveMessage', message);

	const tempid = message._id;
	delete message._id;

	RocketChat.models.Messages.update({ _id: tempid }, { $set: message });

	const room = RocketChat.models.Rooms.findOneById(message.rid);

	Meteor.defer(function() {
		RocketChat.callbacks.run('afterSaveMessage', RocketChat.models.Messages.findOneById(tempid), room);
	});
};
