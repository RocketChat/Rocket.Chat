import { Meteor } from 'meteor/meteor';
import _ from 'underscore';

const fields = {
	_id: 1,
	name: 1,
	fname: 1,
	t: 1,
	cl: 1,
	u: 1,
	// usernames: 1,
	topic: 1,
	announcement: 1,
	announcementDetails: 1,
	muted: 1,
	_updatedAt: 1,
	archived: 1,
	jitsiTimeout: 1,
	description: 1,
	default: 1,
	customFields: 1,
	lastMessage: 1,
	retention: 1,

	// @TODO create an API to register this fields based on room type
	livechatData: 1,
	tags: 1,
	sms: 1,
	facebook: 1,
	code: 1,
	joinCodeRequired: 1,
	open: 1,
	v: 1,
	label: 1,
	ro: 1,
	reactWhenReadOnly: 1,
	sysMes: 1,
	sentiment: 1,
	tokenpass: 1,
	streamingOptions: 1,
	broadcast: 1,
	encrypted: 1,
	e2eKeyId: 1,
	roles:1,
};

const roomMap = (record) => {
	if (record) {
		return _.pick(record, ...Object.keys(fields));
	}
	return {};
};

Meteor.methods({
	'rooms/get'(updatedAt) {
		let options = { fields };

		if (!Meteor.userId()) {
			if (RocketChat.settings.get('Accounts_AllowAnonymousRead') === true) {
				return RocketChat.models.Rooms.findByDefaultAndTypes(true, ['c'], options).fetch();
			}
			return [];
		}

		this.unblock();

		options = {
			fields,
		};

		if (updatedAt instanceof Date) {
			return {
				update: RocketChat.models.Rooms.findBySubscriptionUserIdUpdatedAfter(Meteor.userId(), updatedAt, options).fetch(),
				remove: RocketChat.models.Rooms.trashFindDeletedAfter(updatedAt, {}, { fields: { _id: 1, _deletedAt: 1 } }).fetch(),
			};
		}

		return RocketChat.models.Rooms.findBySubscriptionUserId(Meteor.userId(), options).fetch();
	},

	getRoomByTypeAndName(type, name) {
		const userId = Meteor.userId();

		if (!userId && RocketChat.settings.get('Accounts_AllowAnonymousRead') === false) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getRoomByTypeAndName' });
		}

		const roomFind = RocketChat.roomTypes.getRoomFind(type);

		let room;

		if (roomFind) {
			room = roomFind.call(this, name);
		} else {
			room = RocketChat.models.Rooms.findByTypeAndName(type, name).fetch();
		}

		if (!room || room.length === 0) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'getRoomByTypeAndName' });
		}

		room = room[0];

		if (!Meteor.call('canAccessRoom', room._id, userId)) {
			throw new Meteor.Error('error-no-permission', 'No permission', { method: 'getRoomByTypeAndName' });
		}

		if (RocketChat.settings.get('Store_Last_Message') && !RocketChat.authz.hasPermission(userId, 'preview-c-room')) {
			delete room.lastMessage;
		}

		return roomMap(room);
	},
});

const getSubscriptions = (id) => {
	const fields = { 'u._id': 1 };
	return RocketChat.models.Subscriptions.trashFind({ rid: id }, { fields });
};

RocketChat.models.Rooms.on('change', ({ clientAction, id, data }) => {
	switch (clientAction) {
		case 'updated':
		case 'inserted':
			// Override data cuz we do not publish all fields
			data = RocketChat.models.Rooms.findOneById(id, { fields });
			break;

		case 'removed':
			data = { _id: id };
			break;
	}

	if (data) {
		if (clientAction === 'removed') {
			getSubscriptions(clientAction, id).forEach(({ u }) => {
				RocketChat.Notifications.notifyUserInThisInstance(u._id, 'rooms-changed', clientAction, data);
			});
		}
		RocketChat.Notifications.streamUser.__emit(id, clientAction, data);
	}
});
