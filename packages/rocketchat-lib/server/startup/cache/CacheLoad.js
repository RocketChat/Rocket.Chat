RocketChat.models.Rooms.cache.hasMany('Subscriptions', {
	field: 'usernames',
	link: {
		local: '_id',
		remote: 'rid',
		transform(room, subscription) {
			return subscription.u.username;
		},
		remove(arr, subscription) {
			if (arr.indexOf(subscription.u.username) > -1) {
				arr.splice(arr.indexOf(subscription.u.username), 1);
			}
		}
	}
});


RocketChat.cache.Subscriptions.hasOne('Rooms', {
	field: '_room',
	link: {
		local: 'rid',
		remote: '_id'
	}
});


RocketChat.cache.Subscriptions.hasOne('Users', {
	field: '_user',
	link: {
		local: 'u._id',
		remote: '_id'
	}
});


RocketChat.cache.Users.load();
RocketChat.models.Rooms.cache.load();
RocketChat.cache.Subscriptions.load();
RocketChat.models.Settings.cache.load();


RocketChat.cache.Users.addDynamicView('highlights').applyFind({
	'settings.preferences.highlights': {$size: {$gt: 0}}
});

RocketChat.cache.Subscriptions.addDynamicView('notifications').applyFind({
	$or: [
		{desktopNotifications: {$in: ['all', 'nothing']}},
		{mobilePushNotifications: {$in: ['all', 'nothing']}}
	]
});
