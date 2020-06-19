import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';
import { check } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import AuditLog from './auditLog';
import { LivechatRooms, Rooms, Messages } from '../../../../app/models/server';
import { hasAllPermission } from '../../../../app/authorization/server';

const getValue = (room) => room && { rids: [room._id], name: room.name };

const getRoomInfoByAuditParams = ({ type, roomId, users, visitor, agent }) => {
	if (roomId) {
		return getValue(Rooms.findOne({ _id: roomId }));
	}

	if (type === 'd') {
		return getValue(Rooms.findDirectRoomContainingAllUsernames(users));
	}

	if (type === 'l') {
		const rooms = LivechatRooms.findByVisitorIdAndAgentId(visitor, agent, { fields: { _id: 1 } }).fetch();
		return rooms && rooms.length && { rids: rooms.map(({ _id }) => _id), name: TAPi18n.__('Omnichannel') };
	}
};

Meteor.methods({
	auditGetMessages({ rid: roomId, startDate, endDate, users, msg, type, visitor, agent }) {
		check(startDate, Date);
		check(endDate, Date);

		const user = Meteor.user();
		if (!hasAllPermission(user._id, 'can-audit')) {
			throw new Meteor.Error('Not allowed');
		}

		const roomInfo = getRoomInfoByAuditParams({ type, roomId, users, visitor, agent });
		if (!roomInfo) {
			throw new Meteor.Error('Room doesn`t exist');
		}

		const { rids, name } = roomInfo;

		const query = {
			rid: { $in: rids },
			ts: {
				$gt: startDate,
				$lt: endDate,
			},
		};

		if (msg) {
			const regex = new RegExp(s.trim(s.escapeRegExp(msg)), 'i');
			query.msg = regex;
		}
		const messages = Messages.find(query).fetch();

		// Once the filter is applied, messages will be shown and a log containing all filters will be saved for further auditing.

		AuditLog.insert({ ts: new Date(), results: messages.length, u: user, fields: { msg, users, rids, room: name, startDate, endDate, type, visitor, agent } });

		return messages;
	},
	auditGetAuditions({ startDate, endDate }) {
		check(startDate, Date);
		check(endDate, Date);
		if (!hasAllPermission(Meteor.userId(), 'can-audit-log')) {
			throw new Meteor.Error('Not allowed');
		}
		return AuditLog.find({
			// 'u._id': userId,
			ts: {
				$gt: startDate,
				$lt: endDate,
			},
		}).fetch();
	},
});

DDPRateLimiter.addRule({
	type: 'method',
	name: 'auditGetAuditions',
	userId(/* userId*/) {
		return true;
	},
}, 10, 60000);

DDPRateLimiter.addRule({
	type: 'method',
	name: 'auditGetMessages',
	userId(/* userId*/) {
		return true;
	},
}, 10, 60000);
