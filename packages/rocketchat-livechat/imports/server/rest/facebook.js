import crypto from 'crypto';

import LivechatVisitors from '../../../server/models/LivechatVisitors';

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
 */
RocketChat.API.v1.addRoute('livechat/facebook', {
	post() {
		if (!this.bodyParams.text && !this.bodyParams.attachments) {
			return {
				success: false
			};
		}

		if (!this.request.headers['x-hub-signature']) {
			return {
				success: false
			};
		}

		if (!RocketChat.settings.get('Livechat_Facebook_Enabled')) {
			return {
				success: false,
				error: 'Integration disabled'
			};
		}

		// validate if request come from omni
		const signature = crypto.createHmac('sha1', RocketChat.settings.get('Livechat_Facebook_API_Secret')).update(JSON.stringify(this.request.body)).digest('hex');
		if (this.request.headers['x-hub-signature'] !== `sha1=${ signature }`) {
			return {
				success: false,
				error: 'Invalid signature'
			};
		}

		const sendMessage = {
			message: {
				_id: this.bodyParams.mid
			},
			roomInfo: {
				facebook: {
					page: this.bodyParams.page
				}
			}
		};

		let visitor = LivechatVisitors.getVisitorByToken(this.bodyParams.token);
		if (visitor) {
			const rooms = RocketChat.models.Rooms.findOpenByVisitorToken(visitor.profile.token).fetch();

			if (rooms && rooms.length > 0) {
				sendMessage.message.rid = rooms[0]._id;
			} else {
				sendMessage.message.rid = Random.id();
			}
			sendMessage.message.token = visitor.profile.token;
		} else {
			sendMessage.message.rid = Random.id();
			sendMessage.message.token = this.bodyParams.token;

			const userId = RocketChat.Livechat.registerGuest({
				token: sendMessage.message.token,
				name: `${ this.bodyParams.first_name } ${ this.bodyParams.last_name }`
			});

			visitor = RocketChat.models.Users.findOneById(userId);
		}

		sendMessage.message.msg = this.bodyParams.text;
		sendMessage.guest = visitor;

		try {
			return {
				sucess: true,
				message: RocketChat.Livechat.sendMessage(sendMessage)
			};
		} catch (e) {
			console.error('Error using Facebook ->', e);
		}
	}
});
