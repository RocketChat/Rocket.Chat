import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { isPOSTLivechatTranscriptParams } from '@rocket.chat/rest-typings';

import { API } from '../../../../api/server';
import { Livechat } from '../../lib/Livechat';

API.v1.addRoute(
	'livechat/transcript',
	{ validateParams: isPOSTLivechatTranscriptParams },
	{
		async post() {
			const { token, rid, email } = this.bodyParams;
			// @ts-expect-error -- typings on sendtranscript are wrong
			if (!(await Livechat.sendTranscript({ token, rid, email }))) {
				return API.v1.failure({ message: TAPi18n.__('Error_sending_livechat_transcript') });
			}

			return API.v1.success({ message: TAPi18n.__('Livechat_transcript_sent') });
		},
	},
);
