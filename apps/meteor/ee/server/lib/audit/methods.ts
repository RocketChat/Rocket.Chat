import type { ILivechatAgent, ILivechatVisitor, IMessage, IRoom, IUser, IAuditLog } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { LivechatRooms, Messages, Rooms, Users, AuditLog } from '@rocket.chat/models';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import { check } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { Meteor } from 'meteor/meteor';
import type { Filter } from 'mongodb';

import { hasPermissionAsync } from '../../../../app/authorization/server/functions/hasPermission';
import { updateCounter } from '../../../../app/statistics/server';
import { callbacks } from '../../../../lib/callbacks';
import { isTruthy } from '../../../../lib/isTruthy';
import { i18n } from '../../../../server/lib/i18n';

const getValue = (room: IRoom | null) => room && { rids: [room._id], name: room.name };

const getUsersIdFromUserName = async (usernames: IUser['username'][]) => {
	const users = usernames ? await Users.findByUsernames(usernames.filter(isTruthy)).toArray() : undefined;

	return users?.filter(isTruthy).map((userId) => userId._id);
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
		const extraQuery = await callbacks.run('livechat.applyRoomRestrictions', {});
		const rooms: IRoom[] = await LivechatRooms.findByVisitorIdAndAgentId(
			visitor,
			agent,
			{
				projection: { _id: 1 },
			},
			extraQuery,
		).toArray();
		return rooms?.length ? { rids: rooms.map(({ _id }) => _id), name: i18n.t('Omnichannel') } : undefined;
	}
};

declare module '@rocket.chat/ddp-client' {
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
			type: string;
			visitor?: ILivechatVisitor['_id'];
			agent?: ILivechatAgent['_id'];
		}) => IMessage[];
	}
}

Meteor.methods<ServerMethods>({
	async auditGetOmnichannelMessages({ startDate, endDate, users: usernames, msg, type, visitor, agent }) {
		check(startDate, Date);
		check(endDate, Date);

		const user = (await Meteor.userAsync()) as IUser;
		if (!user || !(await hasPermissionAsync(user._id, 'can-audit'))) {
			throw new Meteor.Error('Not allowed');
		}

		const userFields = {
			_id: user._id,
			username: user.username,
			...(user.name && { name: user.name }),
			...(user.avatarETag && { avatarETag: user.avatarETag }),
		};

		const rooms: IRoom[] = await LivechatRooms.findByVisitorIdAndAgentId(visitor, agent, {
			projection: { _id: 1 },
		}).toArray();
		const rids = rooms?.length ? rooms.map(({ _id }) => _id) : undefined;
		const name = i18n.t('Omnichannel');

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

		await AuditLog.insertOne({
			ts: new Date(),
			results: messages.length,
			u: userFields,
			fields: { msg, users: usernames, rids, room: name, startDate, endDate, type, visitor, agent },
		});

		return messages;
	},
	async auditGetMessages({ rid, startDate, endDate, users: usernames, msg, type, visitor, agent }) {
		check(startDate, Date);
		check(endDate, Date);

		const user = (await Meteor.userAsync()) as IUser;
		if (!user || !(await hasPermissionAsync(user._id, 'can-audit'))) {
			throw new Meteor.Error('Not allowed');
		}

		const userFields = {
			_id: user._id,
			username: user.username,
			...(user.name && { name: user.name }),
			...(user.avatarETag && { avatarETag: user.avatarETag }),
		};

		let rids;
		let name;

		const query: Filter<IMessage> = {
			ts: {
				$gt: startDate,
				$lt: endDate,
			},
		};

		if (type === 'u') {
			const usersId = await getUsersIdFromUserName(usernames);
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

		await AuditLog.insertOne({
			ts: new Date(),
			results: messages.length,
			u: userFields,
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
		return AuditLog.find(
			{
				// 'u._id': userId,
				ts: {
					$gt: startDate,
					$lt: endDate,
				},
			},
			{
				projection: {
					'u.services': 0,
					'u.roles': 0,
					'u.lastLogin': 0,
					'u.statusConnection': 0,
					'u.emails': 0,
				},
			},
		).toArray();
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
