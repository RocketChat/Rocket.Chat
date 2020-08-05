import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import axios from 'axios';

import { FileUpload } from '../../../../file-upload';
import { LivechatRooms, LivechatVisitors, LivechatDepartment } from '../../../../models';
import { API } from '../../../../api/server';
import { SMS } from '../../../../sms';
import { Livechat } from '../../../server/lib/Livechat';

const fileStore = FileUpload.getStore('Uploads');

const getUploadFile = async (details, fileUrl) => {
	try {
		const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
		const { data } = response;
		const size = Buffer.byteLength(data);
		return fileStore.insertSync({ ...details, size }, data);
	} catch (error) {
		throw new Error(error);
	}
};

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
	const { extra: { fromLatitude: latitude, fromLongitude: longitude } = {} } = payload;
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
		const rid = (room && room._id) || Random.id();

		const sendMessage = {
			guest: visitor,
			roomInfo: {
				sms: {
					from: sms.to,
				},
			},
		};

		let file;
		const attachments = Promise.await(Promise.all(sms.media.map(async (curr) => {
			const { url: twilioUrl, contentType } = curr;

			if (!file) {
				const details = {
					name: 'Twilio Upload File',
					type: contentType,
					rid,
					visitorToken: token,
				};

				const upload = await getUploadFile(details, twilioUrl);
				file = Object.assign({}, { _id: upload._id, name: upload.name, type: upload.type });
			}

			const url = FileUpload.getPath(`${ file._id }/${ encodeURI(file.name) }`);

			const attachment = {
				message_link: url,
			};

			switch (contentType.substr(0, contentType.indexOf('/'))) {
				case 'image':
					attachment.image_url = url;
					break;
				case 'video':
					attachment.video_url = url;
					break;
				case 'audio':
					attachment.audio_url = url;
					break;
			}

			return attachment;
		})));

		const message = {
			_id: Random.id(),
			rid: (room && room._id) || Random.id(),
			token,
			msg: sms.body,
			...location && { location },
			...attachments && { attachments },
			...file && { file },
		};

		Object.assign(sendMessage, { message });

		try {
			const msg = SMSService.response.call(this, Promise.await(Livechat.sendMessage(sendMessage)));
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

			return msg;
		} catch (e) {
			return SMSService.error.call(this, e);
		}
	},
});
