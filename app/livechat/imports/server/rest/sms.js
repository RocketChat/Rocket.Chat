import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';

import { LivechatRooms, LivechatVisitors, LivechatDepartment } from '../../../../models';
import { API } from '../../../../../server/api';
import { SMS } from '../../../../../server/sms';
import { Livechat } from '../../../server/lib/Livechat';

const defineDepartment = (idOrName) => {
	if (!idOrName || idOrName === '') {
		return;
	}

	const department = LivechatDepartment.findOneByIdOrName(idOrName);
	return department && department._id;
};

const defineVisitor = (smsNumber) => {
	const visitor = LivechatVisitors.findOneVisitorByPhone(smsNumber);
	let data = {
		token: (visitor && visitor.token) || Random.id(),
	};

	if (!visitor) {
		data = Object.assign(data, {
			username: smsNumber.replace(/[^0-9]/g, ''),
			phone: {
				number: smsNumber,
			},
		});
	}

	const department = defineDepartment(SMS.department);
	if (department) {
		data.department = department;
	}

	const id = Livechat.registerGuest(data);
	return LivechatVisitors.findOneById(id);
};

const normalizeLocationSharing = (payload) => {
	const { extra: { fromLatitude: latitude, fromLongitude: longitude } = { } } = payload;
	if (!latitude || !longitude) {
		return;
	}

	return {
		type: 'Point',
		coordinates: [parseFloat(longitude), parseFloat(latitude)],
	};
};

API.v1.addRoute('livechat/sms-incoming/:service', {
	post() {
		const SMSService = SMS.getService(this.urlParams.service);
		const sms = SMSService.parse(this.bodyParams);

		const visitor = defineVisitor(sms.from);
		const { token } = visitor;
		const room = LivechatRooms.findOneOpenByVisitorToken(token);
		const location = normalizeLocationSharing(sms);

		const sendMessage = {
			message: {
				_id: Random.id(),
				rid: (room && room._id) || Random.id(),
				token,
				msg: sms.body,
				...location && { location },
			},
			guest: visitor,
			roomInfo: {
				sms: {
					from: sms.to,
				},
			},
		};

		sendMessage.message.attachments = sms.media.map((curr) => {
			const attachment = {
				message_link: curr.url,
			};

			const { contentType } = curr;
			switch (contentType.substr(0, contentType.indexOf('/'))) {
				case 'image':
					attachment.image_url = curr.url;
					break;
				case 'video':
					attachment.video_url = curr.url;
					break;
				case 'audio':
					attachment.audio_url = curr.url;
					break;
			}

			return attachment;
		});

		try {
			const message = SMSService.response.call(this, Promise.await(Livechat.sendMessage(sendMessage)));

			Meteor.defer(() => {
				if (sms.extra) {
					if (sms.extra.fromCountry) {
						Meteor.call('livechat:setCustomField', sendMessage.message.token, 'country', sms.extra.fromCountry);
					}
					if (sms.extra.fromState) {
						Meteor.call('livechat:setCustomField', sendMessage.message.token, 'state', sms.extra.fromState);
					}
					if (sms.extra.fromCity) {
						Meteor.call('livechat:setCustomField', sendMessage.message.token, 'city', sms.extra.fromCity);
					}
				}
			});

			return message;
		} catch (e) {
			return SMSService.error.call(this, e);
		}
	},
});
