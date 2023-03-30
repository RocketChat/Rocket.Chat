import _ from 'underscore';

import { Base } from './_Base';
import Rooms from './Rooms';
import { settings } from '../../../settings/server';

export class Messages extends Base {
	constructor() {
		super('message');

		this.tryEnsureIndex({ rid: 1, ts: 1, _updatedAt: 1 });
		this.tryEnsureIndex({ ts: 1 });
		this.tryEnsureIndex({ 'u._id': 1 });
		this.tryEnsureIndex({ editedAt: 1 }, { sparse: true });
		this.tryEnsureIndex({ 'editedBy._id': 1 }, { sparse: true });
		this.tryEnsureIndex({ 'rid': 1, 't': 1, 'u._id': 1 });
		this.tryEnsureIndex({ expireAt: 1 }, { expireAfterSeconds: 0 });
		this.tryEnsureIndex({ msg: 'text' });
		this.tryEnsureIndex({ 'file._id': 1 }, { sparse: true });
		this.tryEnsureIndex({ 'mentions.username': 1 }, { sparse: true });
		this.tryEnsureIndex({ pinned: 1 }, { sparse: true });
		this.tryEnsureIndex({ location: '2dsphere' });
		this.tryEnsureIndex({ slackTs: 1, slackBotId: 1 }, { sparse: true });
		this.tryEnsureIndex({ unread: 1 }, { sparse: true });

		// discussions
		this.tryEnsureIndex({ drid: 1 }, { sparse: true });
		// threads
		this.tryEnsureIndex({ tmid: 1 }, { sparse: true });
		this.tryEnsureIndex({ tcount: 1, tlm: 1 }, { sparse: true });
		this.tryEnsureIndex({ rid: 1, tlm: -1 }, { partialFilterExpression: { tcount: { $exists: true } } }); // used for the List Threads
		this.tryEnsureIndex({ rid: 1, tcount: 1 }); // used for the List Threads Count
		// livechat
		this.tryEnsureIndex({ 'navigation.token': 1 }, { sparse: true });
	}

	updateOTRAck(_id, otrAck) {
		const query = { _id };
		const update = { $set: { otrAck } };
		return this.update(query, update);
	}

	// FIND

	findByRoomId(roomId, options) {
		const query = {
			rid: roomId,
		};

		return this.find(query, options);
	}

	setSlackBotIdAndSlackTs(_id, slackBotId, slackTs) {
		const query = { _id };

		const update = {
			$set: {
				slackBotId,
				slackTs,
			},
		};

		return this.update(query, update);
	}

	// INSERT
	/**
	 * @returns {Pick<IMessage, '_id' | 't' | 'rid' | 'ts' | 'msg' | 'u' | 'groupable' | 'unread'>}
	 */
	createWithTypeRoomIdMessageAndUser(type, roomId, message, user, extraData) {
		const record = {
			t: type,
			rid: roomId,
			ts: new Date(),
			msg: message,
			u: {
				_id: user._id,
				username: user.username,
			},
			groupable: false,
		};

		if (settings.get('Message_Read_Receipt_Enabled')) {
			record.unread = true;
		}

		_.extend(record, extraData);

		record._id = this.insertOrUpsert(record);
		Rooms.incMsgCountById(roomId, 1);
		return record;
	}

	createNavigationHistoryWithRoomIdMessageAndUser(roomId, message, user, extraData) {
		const type = 'livechat_navigation_history';
		const record = {
			t: type,
			rid: roomId,
			ts: new Date(),
			msg: message,
			u: {
				_id: user._id,
				username: user.username,
			},
			groupable: false,
		};

		if (settings.get('Message_Read_Receipt_Enabled')) {
			record.unread = true;
		}

		_.extend(record, extraData);

		record._id = this.insertOrUpsert(record);
		return record;
	}

	createOtrSystemMessagesWithRoomIdAndUser(roomId, user, id, extraData) {
		const message = user.username;
		return this.createWithTypeRoomIdMessageAndUser(id, roomId, message, user, extraData);
	}
}

export default new Messages();
