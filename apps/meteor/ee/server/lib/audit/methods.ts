import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import type { ILivechatAgent, ILivechatVisitor, IMessage, IRoom, IUser } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import type { Filter } from 'mongodb';
import { LivechatRooms, Messages, Rooms } from '@rocket.chat/models';

import AuditLog from './AuditLog';
import { Users } from '../../../../app/models/server';
import { hasPermissionAsync } from '../../../../app/authorization/server/functions/hasPermission';
import { updateCounter } from '../../../../app/statistics/server';
import type { IAuditLog } from '../../../definition/IAuditLog';

const getValue = (room: IRoom | null) => room && { rids: [room._id], name: room.name };

const getUsersIdFromUserName = (usernames: IUser['username'][]) => {
	const user: IUser[] = usernames ? Users.findByUsername({ $in: usernames }) : undefined;
	return user.map((userId) => userId._id);
};

const getRoomInfoByAuditParams = async ({
	type,
	roomId: rid,
	users: usernames,
	visitor,
	agent,
}: {
	type: string;
	roomId: IRoom['_id'];
	users: NonNullable<IUser['username']>[];
	visitor: ILivechatVisitor['_id'];
	agent: ILivechatAgent['_id'];
}) => {
	if (rid) {
		return getValue(await Rooms.findOne({ _id: rid }));
	}

	if (type === 'd') {
		return getValue(await Rooms.findDirectRoomContainingAllUsernames(usernames));
	}

	if (type === 'l') {
		console.warn('Deprecation Warning! This method will be removed in the next version (4.0.0)');
		const rooms: IRoom[] = await LivechatRooms.findByVisitorIdAndAgentId(visitor, agent, {
			projection: { _id: 1 },
		}).toArray();
		return rooms?.length ? { rids: rooms.map(({ _id }) => _id), name: TAPi18n.__('Omnichannel') } : undefined;
	}
};

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		auditGetAuditions: (params: { startDate: Date; endDate: Date }) => IAuditLog[];
		auditGetMessages: (params: {
			rid: IRoom['_id'];
			startDate: Date;
			endDate: Date;
			users: NonNullable<IUser['username']>[];
			msg: IMessage['msg'];
			type: string;
			visitor: ILivechatVisitor['_id'];
			agent: ILivechatAgent['_id'];
		}) => IMessage[];
		auditGetOmnichannelMessages: (params: {
			startDate: Date;
			endDate: Date;
			users: NonNullable<IUser['username']>[];
			msg: IMessage['msg'];
			type: 'l';
			visitor?: ILivechatVisitor['_id'];
			agent?: ILivechatAgent['_id'];
		}) => IMessage[];
	}
}

Meteor.methods<ServerMethods>({
	async auditGetOmnichannelMessages({ startDate, endDate, users: usernames, msg, type, visitor, agent }) {
		check(startDate, Date);
		check(endDate, Date);

		const user = await Meteor.userAsync();
		if (!user || !(await hasPermissionAsync(user._id, 'can-audit'))) {
			throw new Meteor.Error('Not allowed');
		}

		const rooms: IRoom[] = await LivechatRooms.findByVisitorIdAndAgentId(visitor, agent, {
			projection: { _id: 1 },
		}).toArray();
		const rids = rooms?.length ? rooms.map(({ _id }) => _id) : undefined;
		const name = TAPi18n.__('Omnichannel');

		const query: Filter<IMessage> = {
			rid: { $in: rids },
			ts: {
				$gt: startDate,
				$lt: endDate,
			},
		};

		if (msg) {
			const regex = new RegExp(escapeRegExp(msg).trim(), 'i');
			query.msg = regex;
		}
		const messages = await Messages.find(query).toArray();

		// Once the filter is applied, messages will be shown and a log containing all filters will be saved for further auditing.

		AuditLog.insert({
			ts: new Date(),
			results: messages.length,
			u: user,
			fields: { msg, users: usernames, rids, room: name, startDate, endDate, type, visitor, agent },
		});

		return messages;
	},
	async auditGetMessages({ rid, startDate, endDate, users: usernames, msg, type, visitor, agent }) {
		check(startDate, Date);
		check(endDate, Date);

		const user = await Meteor.userAsync();
		if (!user || !(await hasPermissionAsync(user._id, 'can-audit'))) {
			throw new Meteor.Error('Not allowed');
		}

		let rids;
		let name;

		const query: Filter<IMessage> = {
			ts: {
				$gt: startDate,
				$lt: endDate,
			},
		};

		if (type === 'u') {
			const usersId = getUsersIdFromUserName(usernames);
			query['u._id'] = { $in: usersId };
		} else {
			const roomInfo = await getRoomInfoByAuditParams({ type, roomId: rid, users: usernames, visitor, agent });
			if (!roomInfo) {
				throw new Meteor.Error('Room doesn`t exist');
			}

			rids = roomInfo.rids;
			name = roomInfo.name;
			query.rid = { $in: rids };
		}

		if (msg) {
			const regex = new RegExp(escapeRegExp(msg).trim(), 'i');
			query.msg = regex;
		}

		const messages = await Messages.find(query).toArray();

		// Once the filter is applied, messages will be shown and a log containing all filters will be saved for further auditing.

		AuditLog.insert({
			ts: new Date(),
			results: messages.length,
			u: user,
			fields: { msg, users: usernames, rids, room: name, startDate, endDate, type, visitor, agent },
		});
		updateCounter({ settingsId: 'Message_Auditing_Panel_Load_Count' });

		return messages;
	},
	async auditGetAuditions({ startDate, endDate }) {
		check(startDate, Date);
		check(endDate, Date);
		const uid = Meteor.userId();
		if (!uid || !(await hasPermissionAsync(uid, 'can-audit-log'))) {
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
