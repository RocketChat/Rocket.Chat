
/*
* Hide is a named function that will replace /hide commands
* @param {Object} message - The message object
*/
function Hide(command, params, item) {
	if (command !== 'hide') {
		return;
	}

	Meteor.call('hideRoom', item.rid, error => {
		if (error) {
			RocketChat.Notifications.notifyUser(Meteor.userId(), 'message', {
				_id: Random.id(),
				rid: item.rid,
				ts: new Date,
				msg: TAPi18n.__(error, null, Meteor.user().language)
			});
		}
		if (['channel', 'group', 'direct'].includes(FlowRouter.getRouteName()) && (Session.get('openedRoom') === item.rid)) {
			FlowRouter.go('home');
			Session.delete('openedRoom');
		}
	});
}

RocketChat.slashCommands.add('hide', Hide, { description: 'Hide_the_current_room', clientOnly: true });
