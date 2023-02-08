import type { ILivechatAgent, ILivechatVisitor, IMessage, IRoom, IUser } from '@rocket.chat/core-typings';

import '@rocket.chat/ui-contexts';
import type { IAuditLog } from '../IAuditLog';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	export interface ServerMethods {
		auditGetAuditions: (params: { startDate: Date; endDate: Date }) => IAuditLog[];
		auditGetMessages: (params: {
			rid: IRoom['_id'];
			startDate: Date;
			endDate: Date;
			users: IUser['username'][];
			msg: IMessage['msg'];
			type: string;
			visitor: ILivechatVisitor['_id'];
			agent: ILivechatAgent['_id'];
		}) => IMessage[];
		auditGetOmnichannelMessages: (params: {
			startDate: Date;
			endDate: Date;
			users: IUser['username'][];
			msg: IMessage['msg'];
			type: 'l';
			visitor?: ILivechatVisitor['_id'];
			agent?: ILivechatAgent['_id'];
		}) => IMessage[];
	}
}
