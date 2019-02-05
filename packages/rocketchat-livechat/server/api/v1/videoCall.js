import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { Random } from 'meteor/random';
import { RocketChat } from 'meteor/rocketchat:lib';
import { findGuest, getRoom, settings } from '../lib/livechat';

RocketChat.API.v1.addRoute('livechat/video.call/:token', {
	get() {
		try {
			check(this.urlParams, {
				token: String,
			});

			check(this.queryParams, {
				rid: Match.Maybe(String),
			});

			const { token } = this.urlParams;

			const guest = findGuest(token);
			if (!guest) {
				throw new Meteor.Error('invalid-token');
			}

			const rid = this.queryParams.rid || Random.id();
			const { room } = getRoom(guest, rid, { jitsiTimeout: new Date(Date.now() + 3600 * 1000) });
			const config = settings();
			if (!config.theme || !config.theme.actionLinks) {
				throw new Meteor.Error('invalid-livechat-config');
			}

			RocketChat.models.Messages.createWithTypeRoomIdMessageAndUser('livechat_video_call', room._id, '', guest, {
				actionLinks: config.theme.actionLinks,
			});

			const videoCall = {
				rid,
				domain: RocketChat.settings.get('Jitsi_Domain'),
				provider: 'jitsi',
				room: RocketChat.settings.get('Jitsi_URL_Room_Prefix') + RocketChat.settings.get('uniqueID') + rid,
				timeout: new Date(Date.now() + 3600 * 1000),
			};

			return RocketChat.API.v1.success({ videoCall });
		} catch (e) {
			return RocketChat.API.v1.failure(e);
		}
	},
});
