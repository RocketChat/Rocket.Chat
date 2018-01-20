import _ from 'underscore';

RocketChat.callbacks.add('beforeSaveMessage', function(message) {
	// Test if the message mentions include @here.
	if (message.mentions != null &&
		_.pluck(message.mentions, '_id').some((item) => item === 'here')) {

		// Check if the user has permissions to use @here in both global and room scopes.
		if (!RocketChat.authz.hasPermission(message.u._id, 'mention-here') && !RocketChat.authz.hasPermission(message.u._id, 'mention-here', message.rid)) {

			// Get the language of the user for the error notification.
			const language = RocketChat.models.Users.findOneById(message.u._id).language;
			const action = TAPi18n.__('Notify_active_in_this_room', {}, language);

			// Add a notification to the chat, informing the user that this
			// action is not allowed.
			RocketChat.Notifications.notifyUser(message.u._id, 'message', {
				_id: Random.id(),
				rid: message.rid,
				ts: new Date,
				msg: TAPi18n.__('error-action-not-allowed', { action }, language)
			});

			// Also throw to stop propagation of 'sendMessage'.
			throw new Meteor.Error('error-action-not-allowed', 'Notify here in this room not allowed', {
				method: 'filterATHereTag',
				action: 'Notify_active_in_this_room'
			});
		}
	}

	return message;

}, 1, 'filterATHereTag');
