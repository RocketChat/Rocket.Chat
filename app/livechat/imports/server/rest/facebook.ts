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
 */
interface IApiParams extends Array<any> {
	mid: string; // Facebook message id
	page: string; // Facebook pages id
	token: string; // Facebook user's token
	first_name: string; // Facebook user's first name
	last_name: string; // Facebook user's last name
	text: string;
	// [attachments] // Facebook message attachments
	attachments: any[];
}

interface ISendMessage {
	message: IMessage;
	roomInfo: any;
	guest: any;
	agent: any;
}

interface IMessage {
	_id: string;
	rid?: string;
	token?: string;
	msg?: string;
}

API.v1.addRoute('livechat/facebook', {
	post() {
		const BodyParams: IApiParams = this.bodyParams;

		if (!BodyParams.text && !BodyParams.attachments) {
			return {
				success: false,
			};
		}

		if (!this.request.headers['x-hub-signature']) {
			return {
				success: false,
			};
		}

		if (!settings.get('Livechat_Facebook_Enabled')) {
			return {
				success: false,
				error: 'Integration disabled',
			};
		}

		// validate if request come from omni
		const signature = crypto
			.createHmac('sha1', settings.get<string>('Livechat_Facebook_API_Secret'))
			.update(JSON.stringify(this.request.body))
			.digest('hex');
		if (this.request.headers['x-hub-signature'] !== `sha1=${signature}`) {
			return {
				success: false,
				error: 'Invalid signature',
			};
		}

		const sendMessage: ISendMessage = {
			message: {
				_id: BodyParams.mid,
			},
			roomInfo: {
				facebook: {
					page: BodyParams.page,
				},
			},
			agent: undefined,
			guest: undefined,
		};
		let visitor = LivechatVisitors.getVisitorByToken(BodyParams.token, {});
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
			sendMessage.message.token = BodyParams.token;

			const userId = Livechat.registerGuest({
				token: sendMessage.message.token,
				name: `${BodyParams.first_name} ${BodyParams.last_name}`,
				email: undefined,
				department: undefined,
				phone: undefined,
				username: undefined,
				id: undefined,
				connectionData: undefined,
			});

			visitor = LivechatVisitors.findOneById(userId);
		}

		sendMessage.message.msg = BodyParams.text;
		sendMessage.guest = visitor;

		try {
			return {
				sucess: true,
				message: Livechat.sendMessage(sendMessage),
			};
		} catch (e) {
			Livechat.logger.error('Error using Facebook ->', e);
		}
	},
});
