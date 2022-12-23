import crypto from 'crypto';

import { isPOSTLivechatFacebookParams } from '@rocket.chat/rest-typings';
import { Random } from 'meteor/random';
import { LivechatVisitors } from '@rocket.chat/models';
import type { ILivechatVisitor } from '@rocket.chat/core-typings';

import { API } from '../../../../api/server';
import { LivechatRooms } from '../../../../models/server';
import { settings } from '../../../../settings/server';
import { Livechat } from '../../../server/lib/Livechat';

type SentMessage = {
	message: {
		_id: string;
		rid?: string;
		token?: string;
		msg?: string;
	};
	roomInfo: {
		facebook: {
			page: string;
		};
	};
	guest?: ILivechatVisitor | null;
};

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
API.v1.addRoute(
	'livechat/facebook',
	{ validateParams: isPOSTLivechatFacebookParams },
	{
		async post() {
			if (!this.bodyParams.text && !this.bodyParams.attachments) {
				return API.v1.failure('Invalid request');
			}

			if (!this.request.headers['x-hub-signature']) {
				return API.v1.unauthorized();
			}

			if (!settings.get<boolean>('Livechat_Facebook_Enabled')) {
				return API.v1.failure('Facebook integration is disabled');
			}

			// validate if request come from omni
			const signature = crypto
				.createHmac('sha1', settings.get<string>('Livechat_Facebook_API_Secret'))
				.update(JSON.stringify(this.request.body))
				.digest('hex');
			if (this.request.headers['x-hub-signature'] !== `sha1=${signature}`) {
				return API.v1.unauthorized();
			}

			const sendMessage: SentMessage = {
				message: {
					_id: this.bodyParams.mid,
					msg: this.bodyParams.text,
				},
				roomInfo: {
					facebook: {
						page: this.bodyParams.page,
					},
				},
			};
			let visitor = await LivechatVisitors.getVisitorByToken(this.bodyParams.token, {});
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
				sendMessage.message.token = this.bodyParams.token;

				const userId = await Livechat.registerGuest({
					token: sendMessage.message.token,
					name: `${this.bodyParams.first_name} ${this.bodyParams.last_name}`,
					// TODO: type livechat big file :(
					id: undefined,
					email: undefined,
					phone: undefined,
					department: undefined,
					username: undefined,
					connectionData: undefined,
				});

				visitor = await LivechatVisitors.findOneById(userId);
			}

			sendMessage.guest = visitor;

			try {
				return API.v1.success({
					// @ts-expect-error - Typings on Livechat.sendMessage are wrong
					message: await Livechat.sendMessage(sendMessage),
				});
			} catch (err) {
				Livechat.logger.error({ msg: 'Error using Facebook ->', err });
				return API.v1.failure(err);
			}
		},
	},
);
