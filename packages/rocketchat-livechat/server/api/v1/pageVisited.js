import _ from 'underscore';

RocketChat.API.v1.addRoute('livechat/page.visited', {
	post() {
		try {
			check(this.bodyParams, {
				token: String,
				room: String,
				pageInfo: Match.ObjectIncluding({
					change: String,
					title: String,
					location: Match.ObjectIncluding({
						href: String,
					}),
				}),
			});

			const { token, room, pageInfo } = this.bodyParams;
			const obj = RocketChat.Livechat.savePageHistory(token, room, pageInfo);
			if (obj) {
				const page = _.pick(obj, 'msg', 'navigation');
				return RocketChat.API.v1.success({ page });
			}

			return RocketChat.API.v1.success();
		} catch (e) {
			return RocketChat.API.v1.failure(e);
		}
	},
});
