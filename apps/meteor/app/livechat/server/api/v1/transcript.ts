import { isPOSTLivechatTranscriptParams } from '@rocket.chat/rest-typings';
import { LivechatRooms } from '@rocket.chat/models';

import { API } from '../../../../api/server';
import { Livechat } from '../../lib/LivechatTyped';
import { i18n } from '../../../../../server/lib/i18n';

API.v1.addRoute(
	'livechat/transcript',
	{ validateParams: isPOSTLivechatTranscriptParams },
	{
		async post() {
			const { token, rid, email } = this.bodyParams;
			if (!(await Livechat.sendTranscript({ token, rid, email }))) {
				return API.v1.failure({ message: i18n.t('Error_sending_livechat_transcript') });
			}

			return API.v1.success({ message: i18n.t('Livechat_transcript_sent') });
		},
	},
);

API.v1.addRoute(
	'livechat/transcript/:rid',
	{ authRequired: true, permissionsRequired: ['send-omnichannel-chat-transcript'] },
	{
		async delete() {
			const { rid } = this.urlParams;

			const room = await LivechatRooms.findOneById(rid);
			if (!room?.open) {
				throw new Error('error-invalid-room');
			}

			if (!room.transcriptRequest) {
				throw new Error('error-transcript-not-requested');
			}

			await LivechatRooms.unsetEmailTranscriptRequestedByRoomId(rid);

			return API.v1.success(true);
		},
	},
);
