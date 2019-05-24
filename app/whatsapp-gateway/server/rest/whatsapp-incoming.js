import { Random } from 'meteor/random';

import { Rooms, LivechatVisitors, LivechatDepartment } from '../../../models';
import { API } from '../../../api';
import WhatsAppGateway from '../WhatsAppGateway';
import { Livechat } from '../../../livechat/server/lib/Livechat';

const offlineServiceError = 'no-agent-online';

API.v1.addRoute('livechat/whatsapp-incoming/:service', {
	post() {
		const WhatsAppService = WhatsAppGateway.getService(this.urlParams.service);
		const { id_sessao: sessionId, id_cliente, id_caixa: from, texto: msg, midia } = this.bodyParams;
		let guest = LivechatVisitors.findOneVisitorByPhone(id_cliente);

		const config = WhatsAppService.getConfig() || {};
		const { defaultDepartmentName, offlineServiceMessage } = config;
		let department;
		if (defaultDepartmentName) {
			const dep = LivechatDepartment.findOneByIdOrName(defaultDepartmentName);
			department = dep && dep._id;
		}

		let rid;
		let token;
		if (guest) {
			const rooms = department ? Rooms.findOpenByVisitorTokenAndDepartmentId(guest.token, department).fetch() : Rooms.findOpenByVisitorToken(guest.token).fetch();

			rid = rooms && rooms.length > 0 ? rooms[0]._id : Random.id();
			token = guest.token;
			// Update Guest department..
			Livechat.registerGuest({ token, department });
		} else {
			rid = Random.id();
			token = Random.id();

			const visitorId = Livechat.registerGuest({
				username: id_cliente.replace(/[^0-9]/g, ''),
				token,
				phone: {
					number: id_cliente,
				},
				department,
			});

			guest = LivechatVisitors.findOneById(visitorId);
		}

		let attachments;
		if (midia) {
			const attachment = {};
			const { mime_type, base64 } = midia;
			switch (mime_type.substr(0, mime_type.indexOf('/'))) {
				case 'image':
					attachment.image_url = `data:${ mime_type };base64,${ base64 }`;
					break;
				case 'video':
					attachment.video_url = `data:${ mime_type };base64,${ base64 }`;
					break;
				case 'audio':
					attachment.audio_url = `data:${ mime_type };base64,${ base64 }`;
					break;
			}
			attachments =[attachment];
		}
		const sendMessage = {
			message: {
				_id: Random.id(),
				msg,
				rid,
				token,
				attachments,
			},
			roomInfo: {
				whatsAppGateway: {
					sessionId,
					from,
				},
			},
			guest,
		};

		try {
			const message = Livechat.sendMessage(sendMessage);
			const { _id, msg } = message;
			return { success: true, _id, msg };
		} catch (e) {
			const { error, reason, message } = e;
			if (error && error === offlineServiceError && offlineServiceMessage) {
				WhatsAppService.send(from, id_cliente, offlineServiceMessage);
			}
			return { success: false, error, reason, message };
		}
	},
});
