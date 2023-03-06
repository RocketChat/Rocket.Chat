import type { IVisitor } from '@rocket.chat/apps-engine/definition/livechat';
import type { IBlock } from '@rocket.chat/apps-engine/definition/uikit';

import type { ILivechatAgent } from './ILivechatAgent';
import type { ILivechatCustomField } from './ILivechatCustomField';
import type { IMessage } from './IMessage';
import type { IOmnichannelRoom } from './IRoom';

export type LivechatSendRequestData = {
	label: string;
	topic: string;
	createdAt: Date;
	lastMessageAt: Date;
	tags: Array<string>;
	customFields: Array<ILivechatCustomField>;
	type: string;
	sentAt: Date;
	visitor: IVisitor & { email?: string; phone?: string };
	agentId?: string;
	navigation?: string;
	message?: IMessage['msg'];
	agent?: ILivechatAgent & { email?: string; phone?: string };
	crmData?: HTTP.HTTPResponse['data'];
	messages?: Array<{
		ts: Date;
		editedAt: Date;
		blocks?: IBlock;
		_id: string;
		username: string;
		msg: IMessage['msg'];
	}>;
} & IOmnichannelRoom;
