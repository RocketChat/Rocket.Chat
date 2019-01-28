import { check } from 'meteor/check';
import { TAPi18n } from 'meteor/tap:i18n';
import { RocketChat } from 'meteor/rocketchat:lib';
import { API } from 'meteor/rocketchat:api';

API.v1.addRoute('livechat/offline.message', {
	post() {
		try {
			check(this.bodyParams, {
				name: String,
				email: String,
				message: String,
			});

			const { name, email, message } = this.bodyParams;
			if (!RocketChat.Livechat.sendOfflineMessage({ name, email, message })) {
				return API.v1.failure({ message: TAPi18n.__('Error_sending_livechat_offline_message') });
			}

			return API.v1.success({ message: TAPi18n.__('Livechat_offline_message_sent') });
		} catch (e) {
			return API.v1.failure(e);
		}
	},
});
