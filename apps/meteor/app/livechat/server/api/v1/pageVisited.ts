import type { IOmnichannelSystemMessage } from '@rocket.chat/core-typings';
import { Messages } from '@rocket.chat/models';
import { isPOSTLivechatPageVisitedParams } from '@rocket.chat/rest-typings';

import { API } from '../../../../api/server';
import { Livechat } from '../../lib/Livechat';

API.v1.addRoute(
	'livechat/page.visited',
	{ validateParams: isPOSTLivechatPageVisitedParams },
	{
		async post() {
			const { token, rid, pageInfo } = this.bodyParams;
			const msgId = await Livechat.savePageHistory(token, rid, pageInfo);
			if (!msgId) {
				return API.v1.success();
			}

			const message = await Messages.findOneById<IOmnichannelSystemMessage>(msgId);
			if (!message) {
				return API.v1.success();
			}

			const { msg, navigation } = message;
			return API.v1.success({ page: { msg, navigation } });
		},
	},
);
