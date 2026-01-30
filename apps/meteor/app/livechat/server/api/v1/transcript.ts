import { Omnichannel } from '@rocket.chat/core-services';
import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
import { LivechatRooms, Users } from '@rocket.chat/models';
import { isPOSTLivechatTranscriptParams, isPOSTLivechatTranscriptRequestParams } from '@rocket.chat/rest-typings';

import { i18n } from '../../../../../server/lib/i18n';
import { API } from '../../../../api/server';
import { sendTranscript, requestTranscript } from '../../lib/sendTranscript';

API.v1.addRoute(
	'livechat/transcript',
	{ validateParams: isPOSTLivechatTranscriptParams },
	{
		async post() {
			const { token, rid, email } = this.bodyParams;
			if (!(await sendTranscript({ token, rid, email }))) {
				return API.v1.failure({ message: i18n.t('Error_sending_livechat_transcript') });
			}

			return API.v1.success({ message: i18n.t('Livechat_transcript_sent') });
		},
	},
);

API.v1.addRoute(
	'livechat/transcript/:rid',
	{
		authRequired: true,
		permissionsRequired: ['send-omnichannel-chat-transcript'],
		validateParams: {
			POST: isPOSTLivechatTranscriptRequestParams,
		},
	},
	{
		async delete() {
			const { rid } = this.urlParams;
			const room = await LivechatRooms.findOneById<Pick<IOmnichannelRoom, 'open' | 'transcriptRequest' | 'v'>>(rid, {
				projection: { open: 1, transcriptRequest: 1, v: 1 },
			});

			if (!room?.open) {
				throw new Error('error-invalid-room');
			}
			if (!room.transcriptRequest) {
				throw new Error('error-transcript-not-requested');
			}

			if (!(await Omnichannel.isWithinMACLimit(room))) {
				throw new Error('error-mac-limit-reached');
			}

			await LivechatRooms.unsetEmailTranscriptRequestedByRoomId(rid);

			return API.v1.success();
		},
		async post() {
			const { rid } = this.urlParams;
			const { email, subject } = this.bodyParams;

			const user = await Users.findOneById(this.userId, {
				projection: { _id: 1, username: 1, name: 1, utcOffset: 1 },
			});

			if (!user) {
				throw new Error('error-invalid-user');
			}

			await requestTranscript({ rid, email, subject, user });

			return API.v1.success();
		},
	},
);
