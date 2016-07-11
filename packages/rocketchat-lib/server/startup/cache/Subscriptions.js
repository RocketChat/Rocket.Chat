/* eslint new-cap: 0 */

RocketChat.cache.Subscriptions = new (class CacheUser extends RocketChat.cache._Base {
	constructor() {
		super('Subscriptions');

		this.indexes['rid'] = {type: 'array'};

		this.joins['_room'] = {
			multi: false,
			join: 'Rooms',
			joinField: '_id',
			field: 'rid'
		};
	}
});


RocketChat.cache.Users.load();
RocketChat.cache.Rooms.load();
RocketChat.cache.Subscriptions.load();


RocketChat.cache.Users.addDynamicView('highlights').applyFind({
	'settings.preferences.highlights': {$size: {$gt: 0}}
});

RocketChat.cache.Subscriptions.addDynamicView('notifications').applyFind({
	$or: [
		{desktopNotifications: {$in: ['all', 'nothing']}},
		{mobilePushNotifications: {$in: ['all', 'nothing']}}
	]
});
