import { ClientSafeError } from '@rocket.chat/core-services';
import { OmnichannelSourceType } from '@rocket.chat/core-typings';
import { LivechatVisitors } from '@rocket.chat/models';
import { check } from 'meteor/check';

import { getLivechatMessageCharacterLimit } from '../../lib/omnichannel/getLivechatMessageCharacterLimit';
import type { ILivechatMessage } from '../../lib/omnichannel/localTypes';
import { sendMessage } from '../../lib/omnichannel/messages';

interface ILivechatMessageAgent {
	agentId: string;
	username: string;
}

interface ISendMessageLivechat {
	message: ILivechatMessage;
	agent?: ILivechatMessageAgent;
}

export const sendMessageLivechat = async ({
	message: { token, _id, rid, msg, file, files, attachments },
	agent,
}: ISendMessageLivechat): Promise<boolean> => {
	check(token, String);
	check(rid, String);

	// No projection: the guest is forwarded into the message-sending pipeline, which expects a full visitor.
	const guest = await LivechatVisitors.getVisitorByToken(token);

	if (!guest) {
		throw new ClientSafeError('invalid-token');
	}

	const characterLimit = getLivechatMessageCharacterLimit();
	if (characterLimit !== undefined && msg.length > characterLimit) {
		throw new ClientSafeError('message-length-exceeds-character-limit');
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
