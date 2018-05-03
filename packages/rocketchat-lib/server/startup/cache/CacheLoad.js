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


RocketChat.models.Subscriptions.cache.hasOne('Rooms', {
	field: '_room',
	link: {
		local: 'rid',
		remote: '_id'
	}
});


RocketChat.models.Subscriptions.cache.hasOne('Users', {
	field: '_user',
	link: {
		local: 'u._id',
		remote: '_id'
	}
});

RocketChat.models.Subscriptions.cache.hasOne('Users', {
	field: 'fname',
	link: {
		local: 'name',
		remote: 'username',
		where(subscription/*, user*/) {
			return subscription.t === 'd';
		},
		transform(subscription, user) {
			if (user == null || subscription == null) {
				return undefined;
			}
			// Prevent client cache for old subscriptions with new names
			// Cuz when a user change his name, the subscription's _updateAt
			// will not change
			if (subscription._updatedAt < user._updatedAt) {
				subscription._updatedAt = user._updatedAt;
			}
			return user.name;
		}
	}
});

RocketChat.models.Users.cache.load();
RocketChat.models.Rooms.cache.load();
RocketChat.models.Subscriptions.cache.load();
RocketChat.models.Settings.cache.load();


RocketChat.models.Users.cache.addDynamicView('highlights').applyFind({
	'settings.preferences.highlights': {$size: {$gt: 0}}
});

RocketChat.models.Subscriptions.cache.addDynamicView('notifications').applyFind({
	$or: [
		{desktopNotifications: {$in: ['all', 'nothing']}},
		{mobilePushNotifications: {$in: ['all', 'nothing']}}
	]
});
