RocketChat.callbacks.add('beforeSaveMessage', function(message) {

	// if (RocketChat.settings.get('Message_AllowNotifyAllFilter')) {
	if (true) {
		// Test if the message mentions includes a notification to @all.
		if (message.mentions != null &&
			_.pluck(message.mentions, '_id').some((item) => item === 'all' )) {

			// Check if the user has permissions to notify @all.
			if (RocketChat.authz.hasRole(Meteor.userId(),
					['admin', 'owner', 'moderator'], message.rid) === false) {

				// Get the language of the user for the error notification.
				language = Meteor.user().language;
				action = TAPi18n.__('Notify_all_in_this_room', {}, language);

				// Add a notification to the chat, informing the user that this
				// action is not allowed.
				RocketChat.Notifications.notifyUser(Meteor.userId(), 'message', {
					_id: Random.id(),
					rid: message.rid,
					ts: new Date,
					msg: TAPi18n.__('error-action-not-allowed', { action }, language)
				});

				// Also throw to stop propagation of 'sendMessage'.
				throw new Meteor.Error(
					'error-action-not-allowed',
					'Notify all in this room not allowed',
					{
						method: 'filterATAllTag',
						action: 'Notify_all_in_this_room'
					}
				);
			}
		}
	}

	return message;

}, 1);

