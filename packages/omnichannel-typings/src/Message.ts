import type { IMessage, IRocketChatRecord, IUser } from '@rocket.chat/core-typings';

import type { ILivechatPriority } from './ILivechatPriority';
import type { ILivechatVisitor } from './ILivechatVisitor';
import type { IOmnichannelServiceLevelAgreements } from './IOmnichannelServiceLevelAgreements';

export interface IOmnichannelSystemMessage extends IMessage {
	navigation?: {
		page: {
			title: string;
			location: {
				href: string;
			};
			token?: string;
		};
	};
	transferData?: {
		comment: string;
		transferredBy: {
			name?: string;
			username: string;
		};
		transferredTo: {
			name?: string;
			username: string;
		};
		nextDepartment?: {
			_id: string;
			name?: string;
		};
		scope: 'department' | 'agent' | 'queue';
	};
	requestData?: {
		type: 'visitor' | 'user';
		visitor?: ILivechatVisitor;
		user?: Pick<IUser, '_id' | 'name' | 'username' | 'utcOffset'> | null;
	};
	webRtcCallEndTs?: Date;
	comment?: string;
}

export interface IMessageFromVisitor extends IMessage {
	token: string;
}

export const isMessageFromVisitor = (message: IMessage): message is IMessageFromVisitor => 'token' in message;

declare module '@rocket.chat/core-typings' {
	interface IMessage extends IRocketChatRecord {
		/* used when message type is "omnichannel_sla_change_history" */
		slaData?: {
			definedBy: Pick<IUser, '_id' | 'username'>;
			sla?: Pick<IOmnichannelServiceLevelAgreements, 'name'>;
		};

		/* used when message type is "omnichannel_priority_change_history" */
		priorityData?: {
			definedBy: Pick<IUser, '_id' | 'username'>;
			priority?: Pick<ILivechatPriority, 'name' | 'i18n'>;
		};
	}
}
