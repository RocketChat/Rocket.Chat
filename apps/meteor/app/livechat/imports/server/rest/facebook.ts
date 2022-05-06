import crypto from 'crypto';

import { Random } from 'meteor/random';

import { API } from '../../../../api/server';
import { LivechatRooms, LivechatVisitors } from '../../../../models/server';
import { settings } from '../../../../settings/server';
import { Livechat } from '../../../server/lib/Livechat';

/**
 * @api {post} /livechat/facebook Send Facebook message
 * @apiName Facebook
 * @apiGroup Livechat
 *
 * @apiParam {String} mid Facebook message id
 * @apiParam {String} page Facebook pages id
 * @apiParam {String} token Facebook user's token
 * @apiParam {String} first_name Facebook user's first name
 * @apiParam {String} last_name Facebook user's last name
 * @apiParam {String} [text] Facebook message text
 * @apiParam {String} [attachments] Facebook message attachments
 *
 */
API.v1.addRoute('livechat/facebook', {
	post() {
		const { text, attachments, mid, token = '', page, first_name: firstName, last_name: lastName } = this.bodyParams;

		if (!text && !attachments) {
			// TODO: this won't return a 200, so check with gateway if they support these response codes (they should)
			return API.v1.failure('No text or attachments provided');
		}

		if (!this.request.headers['x-hub-signature']) {
			return API.v1.failure('Missing signature');
		}

		if (!settings.get('Livechat_Facebook_Enabled')) {
			return API.v1.failure('Integration disabled');
		}

		// validate if request come from omni
		const signature = crypto
			.createHmac('sha1', settings.get<string>('Livechat_Facebook_API_Secret'))
			.update(JSON.stringify(this.request.body))
			.digest('hex');
		if (this.request.headers['x-hub-signature'] !== `sha1=${signature}`) {
			return API.v1.failure('Invalid signature');
		}

		const sendMessage = {
			message: {
				rid: mid,
				token,
				msg: text,
			},
			roomInfo: {
				facebook: {
					page,
				},
			},
			agent: undefined,
			guest: undefined,
		};
		let visitor = LivechatVisitors.getVisitorByToken(token);
		if (visitor) {
			const rooms = LivechatRooms.findOpenByVisitorToken(visitor.token).fetch();
			if (rooms && rooms.length > 0) {
				sendMessage.message.rid = rooms[0]._id;
			} else {
				sendMessage.message.rid = Random.id();
			}
			sendMessage.message.token = visitor.token;
		} else {
			sendMessage.message.rid = Random.id();
			sendMessage.message.token = token;

			const userId = Livechat.registerGuest({
				token: sendMessage.message.token,
				name: `${firstName} ${lastName}`,
				email: undefined,
				department: undefined,
				phone: undefined,
				username: undefined,
				id: undefined,
				connectionData: undefined,
			});

			visitor = LivechatVisitors.findOneById(userId);
		}

		sendMessage.message.msg = text;
		sendMessage.guest = visitor;

		return API.v1.success(Livechat.sendMessage(sendMessage));
	},
});
