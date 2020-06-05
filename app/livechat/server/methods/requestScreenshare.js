import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';

import { Messages } from '../../../models';
import { settings } from '../../../settings';
import { Livechat } from '../lib/Livechat';

Meteor.methods({
	async 'livechat:requestScreenshare'(roomId) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', { method: 'livechat:closeByVisitor' });
		}

		const guest = Meteor.user();
		console.log(guest);

		const message = {
			_id: Random.id(),
			rid: roomId || Random.id(),
			msg: '',
			ts: new Date(),
		};

		console.log(message);

		Messages.createWithTypeRoomIdMessageAndUser('request_screenshare_access', roomId, '', guest, {
			actionLinks: [
				{ icon: 'icon-videocam', i18nLabel: 'Accept', method_id: 'createLivechatCall', params: '' },
				{ icon: 'icon-cancel', i18nLabel: 'Decline', method_id: 'denyLivechatCall', params: '' },
			],
		});
		console.log('22');

		return {
			roomId,
		};
	},
});
