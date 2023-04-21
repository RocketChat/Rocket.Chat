import { isPOSTLivechatTranscriptParams } from '@rocket.chat/rest-typings';
import { Translation } from '@rocket.chat/core-services';

import { API } from '../../../../api/server';
import { Livechat } from '../../lib/LivechatTyped';

API.v1.addRoute(
	'livechat/transcript',
	{ validateParams: isPOSTLivechatTranscriptParams },
	{
		async post() {
			const { token, rid, email } = this.bodyParams;
			if (!(await Livechat.sendTranscript({ token, rid, email }))) {
				return API.v1.failure({ message: await Translation.translateToServerLanguage('Error_sending_livechat_transcript') });
			}

			return API.v1.success({ message: await Translation.translateToServerLanguage('Livechat_transcript_sent') });
		},
	},
);
