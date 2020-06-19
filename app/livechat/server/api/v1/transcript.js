import { check } from 'meteor/check';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { API } from '../../../../api/server';
import { Livechat } from '../../lib/Livechat';

API.v1.addRoute('livechat/transcript', {
	post() {
		try {
			check(this.bodyParams, {
				token: String,
				rid: String,
				email: String,
			});

			const { token, rid, email } = this.bodyParams;
			if (!Livechat.sendTranscript({ token, rid, email })) {
				return API.v1.failure({ message: TAPi18n.__('Error_sending_livechat_transcript') });
			}

			return API.v1.success({ message: TAPi18n.__('Livechat_transcript_sent') });
		} catch (e) {
			return API.v1.failure(e);
		}
	},
});
