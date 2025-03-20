import { OmnichannelSourceType } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { LivechatVisitors } from '@rocket.chat/models';
import { Match, check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { settings } from '../../../settings/server';
import type { ILivechatMessage } from '../lib/localTypes';
import { sendMessage } from '../lib/messages';

interface ILivechatMessageAgent {
	agentId: string;
	username: string;
}

interface ISendMessageLivechat {
	message: ILivechatMessage;
	agent?: ILivechatMessageAgent;
}

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		sendMessageLivechat(message: ILivechatMessage, agent: ILivechatMessageAgent): boolean;
	}
}

export const sendMessageLivechat = async ({
	message: { token, _id, rid, msg, file, files, attachments },
	agent,
}: ISendMessageLivechat): Promise<boolean> => {
	check(token, String);
	check(_id, String);
	check(rid, String);
	check(msg, String);

	check(
		agent,
		Match.Maybe({
			agentId: String,
			username: String,
		}),
	);

	const guest = await LivechatVisitors.getVisitorByToken(token, {
		projection: {
			name: 1,
			username: 1,
			department: 1,
			token: 1,
		},
	});

	if (!guest) {
		throw new Meteor.Error('invalid-token');
	}

	if (settings.get('Livechat_enable_message_character_limit') && msg.length > parseInt(settings.get('Livechat_message_character_limit'))) {
		throw new Meteor.Error('message-length-exceeds-character-limit');
	}

	return sendMessage({
		guest,
		message: {
			_id,
			rid,
			msg,
			token,
			file,
			files,
			attachments,
		},
		agent,
		roomInfo: {
			source: {
				type: OmnichannelSourceType.API,
			},
		},
	});
};

Meteor.methods<ServerMethods>({
	async sendMessageLivechat({ token, _id, rid, msg, file, files, attachments }: ILivechatMessage, agent: ILivechatMessageAgent) {
		return sendMessageLivechat({ message: { token, _id, rid, msg, file, files, attachments }, agent });
	},
});
