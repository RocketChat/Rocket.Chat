
/*
 * Leave is a named function that will replace /leave commands
 * @param {Object} message - The message object
 */
	if (Meteor.isClient) {
		RocketChat.slashCommands.add('leave', void 0, {
			description: 'Leave_the_current_channel'
		});
		RocketChat.slashCommands.add('part', void 0, {
			description: 'Leave_the_current_channel'
		});
	} else {
		const Leave = function Leave(command, params, item) {
			if (command === 'leave' || command === 'part') {
				try {
					Meteor.call('leaveRoom', item.rid);
				} catch ({error}) {
					RocketChat.Notifications.notifyUser(Meteor.userId(), 'message', {
						_id: Random.id(),
						rid: item.rid,
						ts: new Date,
						msg: TAPi18n.__(error, null, Meteor.user().language)
					});
				}
			}
		};
		RocketChat.slashCommands.add('leave', Leave);
		RocketChat.slashCommands.add('part', Leave);
	}
