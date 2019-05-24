import { Random } from 'meteor/random';

import { Rooms, LivechatVisitors, LivechatDepartment } from '../../../models';
import { API } from '../../../api';
import WhatsAppGateway from '../WhatsAppGateway';
import { Livechat } from '../../../livechat/server/lib/Livechat';

const offlineServiceError = 'no-agent-online';

API.v1.addRoute('livechat/whatsapp-incoming/:service', {
	post() {
		const WhatsAppService = WhatsAppGateway.getService(this.urlParams.service);
		const { id_sessao: sessionId, id_cliente, id_caixa: from, texto: msg } = this.bodyParams;
		let guest = LivechatVisitors.findOneVisitorByPhone(id_cliente);

		const config = WhatsAppService.getConfig();

		let department;
		if (config.defaultDepartmentName) {
			const dep = LivechatDepartment.findOneByIdOrName(config.defaultDepartmentName);
			department = dep && dep._id;
		}

		let rid;
		let token;
		if (guest) {
			const rooms = department ? Rooms.findOpenByVisitorTokenAndDepartmentId(guest.token, department).fetch() : Rooms.findOpenByVisitorToken(guest.token).fetch();

			rid = rooms && rooms.length > 0 ? rooms[0]._id : Random.id();
			token = guest.token;
			//Update Guest department..
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

		const sendMessage = {
			message: {
				_id: Random.id(),
				msg,
				rid,
				token,
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
			if (e.error && e.error === offlineServiceError) {
				const config = WhatsAppService.getConfig();
				if (config && config.offlineServiceMessage) {
					WhatsAppService.send(from, id_cliente, config.offlineServiceMessage);
				}
			}
			return { success: false, e };
		}
	},
});
