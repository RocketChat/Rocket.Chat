import { check } from 'meteor/check';
import s from 'underscore.string';
import _ from 'underscore';

import {
	LivechatVisitors,
} from '../../../models';
import { settings } from '../../../settings';


export const Contacts = {

	registerContact({ token, name, email, phone, username, livechatData, contactManager, connectionData } = {}) {
		check(token, String);

		let userId;
		const updateUser = {
			$set: {
				token,
			},
		};

		const user = LivechatVisitors.getVisitorByToken(token, { fields: { _id: 1 } });

		if (user) {
			userId = user._id;
		} else {
			if (!username) {
				username = LivechatVisitors.getNextVisitorUsername();
			}

			let existingUser = null;

			if (s.trim(email) !== '' && (existingUser = LivechatVisitors.findOneGuestByEmailAddress(email))) {
				userId = existingUser._id;
			} else {
				const userData = {
					username,
					ts: new Date(),
				};

				if (settings.get('Livechat_Allow_collect_and_store_HTTP_header_informations')) {
					const connection = this.connection || connectionData;
					if (connection && connection.httpHeaders) {
						userData.userAgent = connection.httpHeaders['user-agent'];
						userData.ip = connection.httpHeaders['x-real-ip'] || connection.httpHeaders['x-forwarded-for'] || connection.clientAddress;
						userData.host = connection.httpHeaders.host;
					}
				}

				userId = LivechatVisitors.insert(userData);
			}
		}

		updateUser.$set.name = name;

		updateUser.$set.phone = [
			{ phoneNumber: phone?.number },
		];

		updateUser.$set.visitorEmails = [
			{ address: email },
		];

		updateUser.$set.livechatData = livechatData;

		updateUser.$set.contactManager = !_.isEmpty(contactManager) ? contactManager : '';

		LivechatVisitors.updateById(userId, updateUser);

		return userId;
	},
};
