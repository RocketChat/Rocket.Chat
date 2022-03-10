import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';
import { check } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { escapeRegExp } from '@rocket.chat/string-helpers';

import AuditLog from './auditLog';
import { LivechatRooms, Rooms, Messages, Users } from '../../../../app/models/server';
import { hasPermission } from '../../../../app/authorization/server';
import { updateCounter } from '../../../../app/statistics/server';

const getValue = (room) => room && { rids: [room._id], name: room.name };

const getUsersIdFromUserName = (usersName) => {
	const user = usersName && Users.findByUsername({ $in: usersName });
	return user.map((userId) => userId._id);
};

const getRoomInfoByAuditParams = ({ type, roomId, users, visitor, agent }) => {
	if (roomId) {
		return getValue(Rooms.findOne({ _id: roomId }));
	}

	if (type === 'd') {
		return getValue(Rooms.findDirectRoomContainingAllUsernames(users));
	}

	if (type === 'l') {
		console.warn('Deprecation Warning! This method will be removed in the next version (4.0.0)');
		const rooms = LivechatRooms.findByVisitorIdAndAgentId(visitor, agent, {
			fields: { _id: 1 },
		}).fetch();
		return rooms && rooms.length && { rids: rooms.map(({ _id }) => _id), name: TAPi18n.__('Omnichannel') };
	}
};

Meteor.methods({
	auditGetOmnichannelMessages({ startDate, endDate, users, msg, type, visitor, agent }) {
		check(startDate, Date);
		check(endDate, Date);

		const user = Meteor.user();
		if (!hasPermission(user._id, 'can-audit')) {
			throw new Meteor.Error('Not allowed');
		}

		const rooms = LivechatRooms.findByVisitorIdAndAgentId(visitor, agent !== 'all' && agent, {
			fields: { _id: 1 },
		}).fetch();
		const roomsData = rooms && rooms.length && { rids: rooms.map(({ _id }) => _id), name: TAPi18n.__('Omnichannel') };

		const { rids, name } = roomsData;

		const query = {
			rid: { $in: rids },
			ts: {
				$gt: startDate,
				$lt: endDate,
			},
		};

		if (msg) {
			const regex = new RegExp(s.trim(escapeRegExp(msg)), 'i');
			query.msg = regex;
		}
		const messages = Messages.find(query).fetch();

		// Once the filter is applied, messages will be shown and a log containing all filters will be saved for further auditing.

		AuditLog.insert({
			ts: new Date(),
			results: messages.length,
			u: user,
			fields: { msg, users, rids, room: name, startDate, endDate, type, visitor, agent },
		});

		return messages;
	},
	auditGetMessages({ rid: roomId, startDate, endDate, users, msg, type, visitor, agent }) {
		check(startDate, Date);
		check(endDate, Date);

		const user = Meteor.user();
		if (!hasPermission(user._id, 'can-audit')) {
			throw new Meteor.Error('Not allowed');
		}

		let rids;
		let name;

		const query = {
			ts: {
				$gt: startDate,
				$lt: endDate,
			},
		};

		if (type === 'u') {
			const usersId = getUsersIdFromUserName(users);
			query['u._id'] = { $in: usersId };
		} else {
			const roomInfo = getRoomInfoByAuditParams({ type, roomId, users, visitor, agent });
			if (!roomInfo) {
				throw new Meteor.Error('Room doesn`t exist');
			}

			rids = roomInfo.rids;
			name = roomInfo.name;
			query.rid = { $in: rids };
		}

		if (msg) {
			const regex = new RegExp(s.trim(escapeRegExp(msg)), 'i');
			query.msg = regex;
		}

		const messages = Messages.find(query).fetch();

		// Once the filter is applied, messages will be shown and a log containing all filters will be saved for further auditing.

		AuditLog.insert({
			ts: new Date(),
			results: messages.length,
			u: user,
			fields: { msg, users, rids, room: name, startDate, endDate, type, visitor, agent },
		});
		updateCounter('Message_Auditing_Panel_Load_Count');

		return messages;
	},
	auditGetAuditions({ startDate, endDate }) {
		check(startDate, Date);
		check(endDate, Date);
		if (!hasPermission(Meteor.userId(), 'can-audit-log')) {
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

DDPRateLimiter.addRule(
	{
		type: 'method',
		name: 'auditGetAuditions',
		userId(/* userId*/) {
			return true;
		},
	},
	10,
	60000,
);

DDPRateLimiter.addRule(
	{
		type: 'method',
		name: 'auditGetMessages',
		userId(/* userId*/) {
			return true;
		},
	},
	10,
	60000,
);
