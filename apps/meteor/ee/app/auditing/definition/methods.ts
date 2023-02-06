import type { ILivechatAgent, ILivechatVisitor, IMessage, IRoom, IUser } from '@rocket.chat/core-typings';

import '@rocket.chat/ui-contexts';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	export interface ServerMethods {
		auditGetAuditions: (params: { startDate: Date; endDate: Date }) => unknown[];
		auditGetMessages: (params: {
			rid: IRoom['_id'];
			startDate: Date;
			endDate: Date;
			users: IUser['username'][];
			msg: IMessage['msg'];
			type: string;
			visitor: ILivechatVisitor;
			agent: ILivechatAgent | 'all';
		}) => IMessage[];
		auditGetOmnichannelMessages: (params: {
			rid: IRoom['_id'];
			startDate: Date;
			endDate: Date;
			users: IUser['username'][];
			msg: IMessage['msg'];
			type: string;
			visitor: ILivechatVisitor;
			agent: ILivechatAgent | 'all';
		}) => IMessage[];
	}
}
