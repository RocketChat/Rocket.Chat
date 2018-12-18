import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { RocketChat } from 'meteor/rocketchat:lib';
import _ from 'underscore';
import { findGuest, findRoom } from '../lib/livechat';

RocketChat.API.v1.addRoute('livechat/page.visited', {
	post() {
		try {
			check(this.bodyParams, {
				token: String,
				rid: String,
				pageInfo: Match.ObjectIncluding({
					change: String,
					title: String,
					location: Match.ObjectIncluding({
						href: String,
					}),
				}),
			});

			const { token, rid, pageInfo } = this.bodyParams;

			const guest = findGuest(token);
			if (!guest) {
				throw new Meteor.Error('invalid-token');
			}

			const room = findRoom(token, rid);
			if (!room) {
				throw new Meteor.Error('invalid-room');
			}

			const obj = RocketChat.Livechat.savePageHistory(token, rid, pageInfo);
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
