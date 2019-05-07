import { Meteor } from 'meteor/meteor';
import { roomTypes } from '../../app/utils';
import { hasPermission } from '../../app/authorization';
import { Rooms, Subscriptions } from '../../app/models';
import { settings } from '../../app/settings';
import { Notifications } from '../../app/notifications';
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
	unmuted: 1,
	_updatedAt: 1,
	archived: 1,
	jitsiTimeout: 1,
	description: 1,
	default: 1,
	customFields: 1,
	lastMessage: 1,
	retention: 1,
	prid: 1,

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
	departmentId: 1,
	servedBy: 1,
};

const roomMap = (record) => {
	if (record) {
		return _.pick(record, ...Object.keys(fields));
	}
	return {};
};

Meteor.methods({
	'rooms/get'(updatedAt) {
		const options = { fields };

		if (!Meteor.userId()) {
			if (settings.get('Accounts_AllowAnonymousRead') === true) {
				return Rooms.findByDefaultAndTypes(true, ['c'], options).fetch();
			}
			return [];
		}

		if (updatedAt instanceof Date) {
			return {
				update: Rooms.findBySubscriptionUserIdUpdatedAfter(Meteor.userId(), updatedAt, options).fetch(),
				remove: Rooms.trashFindDeletedAfter(updatedAt, {}, { fields: { _id: 1, _deletedAt: 1 } }).fetch(),
			};
		}

		return Rooms.findBySubscriptionUserId(Meteor.userId(), options).fetch();
	},

	getRoomByTypeAndName(type, name) {
		const userId = Meteor.userId();

		if (!userId && settings.get('Accounts_AllowAnonymousRead') === false) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getRoomByTypeAndName' });
		}

		const roomFind = roomTypes.getRoomFind(type);

		const room = roomFind ? roomFind.call(this, name) : Rooms.findByTypeAndName(type, name);

		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'getRoomByTypeAndName' });
		}

		if (!Meteor.call('canAccessRoom', room._id, userId)) {
			throw new Meteor.Error('error-no-permission', 'No permission', { method: 'getRoomByTypeAndName' });
		}

		if (settings.get('Store_Last_Message') && !hasPermission(userId, 'preview-c-room')) {
			delete room.lastMessage;
		}

		return roomMap(room);
	},
});

const getSubscriptions = (id) => {
	const fields = { 'u._id': 1 };
	return Subscriptions.trashFind({ rid: id }, { fields });
};

Rooms.on('change', ({ clientAction, id, data }) => {
	switch (clientAction) {
		case 'updated':
		case 'inserted':
			// Override data cuz we do not publish all fields
			data = Rooms.findOneById(id, { fields });
			break;

		case 'removed':
			data = { _id: id };
			break;
	}

	if (data) {
		if (clientAction === 'removed') {
			getSubscriptions(clientAction, id).forEach(({ u }) => {
				Notifications.notifyUserInThisInstance(u._id, 'rooms-changed', clientAction, data);
			});
		}
		Notifications.streamUser.__emit(id, clientAction, data);
	}
});
