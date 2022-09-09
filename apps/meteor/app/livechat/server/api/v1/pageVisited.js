import { Match, check } from 'meteor/check';
import _ from 'underscore';

import { API } from '../../../../api/server';
import { Livechat } from '../../lib/Livechat';

API.v1.addRoute('livechat/page.visited', {
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
			const page = _.pick(obj, 'msg', 'navigation');
			return API.v1.success({ page });
		}

		return API.v1.success();
	},
});
