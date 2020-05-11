import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';
import { check } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';

import AuditLog from './auditLog';
import { Rooms, Messages } from '../../../../app/models';
import { hasAllPermission } from '../../../../app/authorization';

Meteor.methods({
	auditGetMessages({ rid, startDate, endDate, users, msg }) {
		check(startDate, Date);
		check(endDate, Date);

		const user = Meteor.user();
		if (!hasAllPermission(user._id, 'can-audit')) {
			throw new Meteor.Error('Not allowed');
		}

		const room = !rid ? Rooms.findDirectRoomContainingAllUsernames(users) : Rooms.findOne({ _id: rid });
		if (!room) {
			throw new Meteor.Error('Room doesn`t exist');
		}

		rid = room._id;

		const query = {
			rid,
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

		AuditLog.insert({ ts: new Date(), results: messages.length, u: user, fields: { msg, users, rid: room._id, room: room.name, startDate, endDate } });

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
