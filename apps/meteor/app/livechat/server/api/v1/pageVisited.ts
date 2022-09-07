import { Match, check } from 'meteor/check';
import { isPOSTLivechatPageVisitedParams } from '@rocket.chat/rest-typings';

import { API } from '../../../../api/server';
import { Livechat } from '../../lib/Livechat';

API.v1.addRoute(
	'livechat/page.visited',
	{ validateParams: isPOSTLivechatPageVisitedParams },
	{
		async post() {
			check(this.bodyParams, {
				token: String,
				rid: Match.Maybe(String),
				pageInfo: Match.ObjectIncluding({
					change: String,
					title: String,
					location: Match.ObjectIncluding({
						href: String,
					}),
				}),
			});

			const { token, rid, pageInfo } = this.bodyParams;
			const obj = Livechat.savePageHistory(token, rid, pageInfo);
			if (obj) {
				// @ts-expect-error -- typings on savePageHistory are wrong
				const { msg, navigation } = obj;
				return API.v1.success({ page: { msg, navigation } });
			}

			return API.v1.success();
		},
	},
);
