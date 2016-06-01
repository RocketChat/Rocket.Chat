RocketChat.callbacks.add('afterSaveMessage', function(message, room) {

	message.actionLinks = [{ label: 'Click Me!', method_id: 'testFunct'},
	{ label: ' Or Click Me! (I do the same thing...)', method_id: 'testFunct'}];

	var tempid = message._id;
	delete message._id;
	RocketChat.models.Messages.update({ _id: tempid }, { $set: message });

}, RocketChat.callbacks.priority.LOW)