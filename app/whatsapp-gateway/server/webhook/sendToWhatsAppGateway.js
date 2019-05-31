import { callbacks } from '../../../callbacks';
import { settings } from '../../../settings';
import WhatsAppGateway from '../WhatsAppGateway';
import { LivechatVisitors } from '../../../models';

callbacks.add('afterSaveMessage', function(message, room) {
	if (message.editedAt) {
		return message;
	}

	if (!WhatsAppGateway.enabled) {
		return message;
	}

	if (!(typeof room.t !== 'undefined' && room.t === 'l' && room.whatsAppGateway && room.v && room.v.token)) {
		return message;
	}

	if (message.token) {
		return message;
	}

	if (message.t) {
		return message;
	}

	const WhatsAppService = WhatsAppGateway.getService(settings.get('WhatsApp_Gateway_Service'));

	if (!WhatsAppService) {
		return message;
	}

	const visitor = LivechatVisitors.getVisitorByToken(room.v.token);

	if (!visitor || !visitor.phone || visitor.phone.length === 0) {
		return message;
	}

	WhatsAppService.send(room.whatsAppGateway.from, visitor.phone[0].phoneNumber, message.msg);

	return message;
}, callbacks.priority.LOW, 'sendToWhatsAppGateway');

callbacks.add('livechat.closeRoom', (room) => {
	if (!WhatsAppGateway.enabled) {
		return room;
	}

	const WhatsAppService = WhatsAppGateway.getService(settings.get('WhatsApp_Gateway_Service'));

	if (!WhatsAppService) {
		return room;
	}

	const config = WhatsAppService.getConfig() || {};
	const { conversationFinishedMessage } = config;
	if (!conversationFinishedMessage) {
		return room;
	}

	if (!(room.whatsAppGateway && room.v && room.v.token && room.closer && room.closer === 'user')) {
		return room;
	}

	const visitor = LivechatVisitors.getVisitorByToken(room.v.token);
	if (!visitor || !visitor.phone || visitor.phone.length === 0) {
		return room;
	}

	WhatsAppService.send(room.whatsAppGateway.from, visitor.phone[0].phoneNumber, conversationFinishedMessage);

}, callbacks.priority.MEDIUM, 'send-whatsapp-gateway-close-room');
