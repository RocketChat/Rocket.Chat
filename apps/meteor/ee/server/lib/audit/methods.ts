import type { ILivechatAgent, ILivechatVisitor, IMessage, IRoom, IUser, IAuditLog } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { check } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { Meteor } from 'meteor/meteor';

import { auditGetAuditionsMethod, auditGetMessagesMethod, auditGetOmnichannelMessagesMethod } from './functions';
import { methodDeprecationLogger } from '../../../../app/lib/server/lib/deprecationWarningLogger';

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
	async auditGetOmnichannelMessages(params) {
		methodDeprecationLogger.method('auditGetOmnichannelMessages', '9.0.0', '/v1/audit.omnichannel.messages');
		check(params.startDate, Date);
		check(params.endDate, Date);
		return auditGetOmnichannelMessagesMethod(Meteor.userId(), params);
	},
	async auditGetMessages(params) {
		methodDeprecationLogger.method('auditGetMessages', '9.0.0', '/v1/audit.messages');
		check(params.startDate, Date);
		check(params.endDate, Date);
		return auditGetMessagesMethod(Meteor.userId(), params);
	},
	async auditGetAuditions({ startDate, endDate }) {
		methodDeprecationLogger.method('auditGetAuditions', '9.0.0', '/v1/audit.auditions');
		check(startDate, Date);
		check(endDate, Date);
		return auditGetAuditionsMethod(Meteor.userId(), startDate, endDate);
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
