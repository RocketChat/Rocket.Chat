import type { IOmnichannelSystemMessage } from '@rocket.chat/core-typings';
import { isPOSTLivechatPageVisitedParams } from '@rocket.chat/rest-typings';

import { API } from '../../../../api/server';
import { Livechat } from '../../lib/LivechatTyped';

API.v1.addRoute(
	'livechat/page.visited',
	{ validateParams: isPOSTLivechatPageVisitedParams },
	{
		async post() {
			const { token, rid, pageInfo } = this.bodyParams;

			const message = await Livechat.savePageHistory(token, rid, pageInfo);
			if (!message) {
				return API.v1.success();
			}

			const { msg, navigation } = message as IOmnichannelSystemMessage;
			return API.v1.success({ page: { msg, navigation } });
		},
	},
);
