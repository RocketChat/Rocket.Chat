import { Random } from 'meteor/random';

import { Migrations } from '../../migrations';
import { Rooms, Messages, Subscriptions, Uploads, Settings, Users } from '../../../app/models/server';

const unifyRooms = (room) => {
	// verify if other DM already exists
	const other = Rooms.findOne({
		_id: { $ne: room._id },
		t: 'd',
		uids: room.uids,
	});

	// we need to at least change the _id of the current room, so remove it
	Rooms.remove({ _id: room._id });

	const newId = (other && other._id) || Random.id();

	if (!other) {
		// create the same room with different _id
		Rooms.insert({
			...room,
			_id: newId,
		});

		// update subscription to point to new room _id
		Subscriptions.update({ rid: room._id }, {
			$set: {
				rid: newId,
			},
		}, { multi: true });

		return newId;
	}

	// the other room exists already, so just remove the subscription of the wrong room
	Subscriptions.remove({ rid: room._id });

	return newId;
};

const fixSelfDMs = () => {
	Rooms.find({
		t: 'd',
		uids: { $size: 1 },
	}).forEach((room) => {
		if (!Array.isArray(room.uids) || room._id !== room.uids[0]) {
			return;
		}

		const correctId = unifyRooms(room);

		// move things to correct room
		Messages.update({ rid: room._id }, {
			$set: {
				rid: correctId,
			},
		}, { multi: true });
		Uploads.update({ rid: room._id }, {
			$set: {
				rid: correctId,
			},
		}, { multi: true });
	});
};

const fixDiscussions = () => {
	Rooms.find({ t: 'd', prid: { $exists: true } }, { fields: { _id: 1 } }).forEach(({ _id }) => {
		const { u } = Messages.findOne({ drid: _id }, { fields: { u: 1 } }) || {};

		Rooms.update({ _id }, {
			$set: {
				t: 'p',
				name: Random.id(),
				u,
				ro: false,
				default: false,
				sysMes: true,
			},
			$unset: {
				usernames: 1,
				uids: 1,
			},
		});
	});
};

const fixUserSearch = () => {
	const setting = Settings.findOneById('Accounts_SearchFields', { fields: { value: 1 } });
	const value = setting?.value?.trim();
	if (value === '' || value === 'username, name') {
		Settings.updateValueById('Accounts_SearchFields', 'username, name, bio');
	}

	Users.tryDropIndex('name_text_username_text_bio_text');
};

Migrations.add({
	version: 183,
	up() {
		fixDiscussions();
		fixSelfDMs();
		fixUserSearch();
	},
});
