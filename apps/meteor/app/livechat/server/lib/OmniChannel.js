import { HTTP } from 'meteor/http';

import { settings } from '../../../settings';

const gatewayURL = 'https://omni.rocket.chat';

export default {
	enable() {
		const result = HTTP.call('POST', `${gatewayURL}/facebook/enable`, {
			headers: {
				'authorization': `Bearer ${settings.get('Livechat_Facebook_API_Key')}`,
				'content-type': 'application/json',
			},
			data: {
				url: settings.get('Site_Url'),
			},
		});
		return result.data;
	},

	disable() {
		const result = HTTP.call('DELETE', `${gatewayURL}/facebook/enable`, {
			headers: {
				'authorization': `Bearer ${settings.get('Livechat_Facebook_API_Key')}`,
				'content-type': 'application/json',
			},
		});
		return result.data;
	},

	listPages() {
		const result = HTTP.call('GET', `${gatewayURL}/facebook/pages`, {
			headers: {
				authorization: `Bearer ${settings.get('Livechat_Facebook_API_Key')}`,
			},
		});
		return result.data;
	},

	subscribe(pageId) {
		const result = HTTP.call('POST', `${gatewayURL}/facebook/page/${pageId}/subscribe`, {
			headers: {
				authorization: `Bearer ${settings.get('Livechat_Facebook_API_Key')}`,
			},
		});
		return result.data;
	},

	unsubscribe(pageId) {
		const result = HTTP.call('DELETE', `${gatewayURL}/facebook/page/${pageId}/subscribe`, {
			headers: {
				authorization: `Bearer ${settings.get('Livechat_Facebook_API_Key')}`,
			},
		});
		return result.data;
	},

	reply({ page, token, text }) {
		return HTTP.call('POST', `${gatewayURL}/facebook/reply`, {
			headers: {
				authorization: `Bearer ${settings.get('Livechat_Facebook_API_Key')}`,
			},
			data: {
				page,
				token,
				text,
			},
		});
	},
};
