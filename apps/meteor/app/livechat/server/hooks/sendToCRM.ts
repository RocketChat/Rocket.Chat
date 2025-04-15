import type { IOmnichannelRoom, IOmnichannelSystemMessage, IMessage } from '@rocket.chat/core-typings';
import { isEditedMessage, isOmnichannelRoom } from '@rocket.chat/core-typings';
import { LivechatRooms, Messages } from '@rocket.chat/models';

import { callbacks } from '../../../../lib/callbacks';
import { settings } from '../../../settings/server';
import { normalizeMessageFileUpload } from '../../../utils/server/functions/normalizeMessageFileUpload';
import { getLivechatRoomGuestInfo } from '../lib/guests';
import { sendRequest } from '../lib/webhooks';

type AdditionalFields =
	| Record<string, unknown>
	| {
			departmentId: IOmnichannelRoom['departmentId'];
	  }
	| {
			departmentId: IOmnichannelRoom['departmentId'];
			servedBy: IOmnichannelRoom['servedBy'];
	  }
	| {
			departmentId: IOmnichannelRoom['departmentId'];
			servedBy: IOmnichannelRoom['servedBy'];
			oldDepartmentId: IOmnichannelRoom['departmentId'];
			oldServedBy: { _id: string; ts: Date; username?: string };
	  }
	| {
			departmentId: IOmnichannelRoom['departmentId'];
			servedBy: IOmnichannelRoom['servedBy'];
			closedAt: IOmnichannelRoom['closedAt'];
			closedBy: IOmnichannelRoom['closedBy'];
			closer: IOmnichannelRoom['closer'];
	  };

type OmnichannelRoomWithExtraFields = IOmnichannelRoom & {
	oldServedBy?: { _id: string; ts: Date; username?: string };
	oldDepartmentId?: IOmnichannelRoom['departmentId'];
};

type CRMActions =
	| 'LivechatSessionStart'
	| 'LivechatSessionQueued'
	| 'LivechatSession'
	| 'LivechatSessionTaken'
	| 'LivechatSessionForwarded'
	| 'LivechatEdit'
	| 'Message'
	| 'LeadCapture';

const msgNavType = 'livechat_navigation_history';
const msgClosingType = 'livechat-close';

export const isOmnichannelNavigationMessage = (message: IMessage): message is IOmnichannelSystemMessage => {
	return message.t === msgNavType;
};

export const isOmnichannelClosingMessage = (message: IMessage): message is IOmnichannelSystemMessage => {
	return message.t === msgClosingType;
};

export const sendMessageType = (msgType: string): boolean => {
	switch (msgType) {
		case msgClosingType:
			return true;
		case msgNavType:
			return (
				settings.get<boolean>('Livechat_Visitor_navigation_as_a_message') &&
				settings.get<boolean>('Send_visitor_navigation_history_livechat_webhook_request')
			);
		default:
			return false;
	}
};

export const getAdditionalFieldsByType = (type: CRMActions, room: OmnichannelRoomWithExtraFields): AdditionalFields => {
	const { departmentId, servedBy, closedAt, closedBy, closer, oldServedBy, oldDepartmentId } = room;
	switch (type) {
		case 'LivechatSessionStart':
		case 'LivechatSessionQueued':
			return { departmentId };
		case 'LivechatSession':
			return { departmentId, servedBy, closedAt, closedBy, closer };
		case 'LivechatSessionTaken':
			return { departmentId, servedBy };
		case 'LivechatSessionForwarded':
			return { departmentId, servedBy, oldDepartmentId, oldServedBy };
		default:
			return {};
	}
};

async function sendToCRM(
	type: CRMActions,
	room: OmnichannelRoomWithExtraFields,
	includeMessages: boolean | IOmnichannelSystemMessage[] = true,
): Promise<OmnichannelRoomWithExtraFields> {
	if (!settings.get('Livechat_webhookUrl')) {
		return room;
	}

	const postData: Awaited<ReturnType<typeof getLivechatRoomGuestInfo>> & {
		type: string;
		messages: IOmnichannelSystemMessage[];
	} = {
		...(await getLivechatRoomGuestInfo(room)),
		type,
		messages: [],
	};

	let messages: IOmnichannelSystemMessage[] | null = null;
	if (typeof includeMessages === 'boolean' && includeMessages) {
		messages = await Messages.findVisibleByRoomId<IOmnichannelSystemMessage>(room._id, { sort: { ts: 1 } }).toArray();
	} else if (includeMessages instanceof Array) {
		messages = includeMessages;
	}

	if (messages) {
		for await (const message of messages) {
			if (message.t && !sendMessageType(message.t)) {
				continue;
			}
			const msg = {
				_id: message._id,
				username: message.u.username,
				msg: message.msg || JSON.stringify(message.blocks),
				...(message.blocks && message.blocks.length > 0 ? { blocks: message.blocks } : {}),
				ts: message.ts,
				rid: message.rid,
				...(isEditedMessage(message) && { editedAt: message.editedAt }),
				...(message.u.username !== postData.visitor.username && { agentId: message.u._id }),
				...(isOmnichannelNavigationMessage(message) && { navigation: message.navigation }),
				...(isOmnichannelClosingMessage(message) && { closingMessage: true }),
				...(message.file && { file: message.file, attachments: message.attachments }),
			};

			const { u } = message;
			postData.messages.push({ ...(await normalizeMessageFileUpload({ u, ...msg })), ...{ _updatedAt: message._updatedAt } });
		}
	}

	const additionalData = getAdditionalFieldsByType(type, room);
	const responseData = Object.assign(postData, additionalData);

	const response = await sendRequest(responseData);

	if (response) {
		const responseData = await response.text();
		await LivechatRooms.saveCRMDataByRoomId(room._id, responseData);
	}

	return room;
}

callbacks.add(
	'livechat.closeRoom',
	async (params) => {
		const { room } = params;
		if (!settings.get('Livechat_webhook_on_close')) {
			return params;
		}

		await sendToCRM('LivechatSession', room);

		return params;
	},
	callbacks.priority.MEDIUM,
	'livechat-send-crm-close-room',
);

callbacks.add(
	'livechat.newRoom',
	async (room) => {
		if (!settings.get('Livechat_webhook_on_start')) {
			return room;
		}

		return sendToCRM('LivechatSessionStart', room);
	},
	callbacks.priority.MEDIUM,
	'livechat-send-crm-start-room',
);

callbacks.add(
	'livechat.afterTakeInquiry',
	async ({ inquiry, room }) => {
		if (!settings.get('Livechat_webhook_on_chat_taken')) {
			return inquiry;
		}

		return sendToCRM('LivechatSessionTaken', room);
	},
	callbacks.priority.MEDIUM,
	'livechat-send-crm-room-taken',
);

callbacks.add(
	'livechat.chatQueued',
	(room) => {
		if (!settings.get('Livechat_webhook_on_chat_queued')) {
			return room;
		}

		return sendToCRM('LivechatSessionQueued', room);
	},
	callbacks.priority.MEDIUM,
	'livechat-send-crm-room-queued',
);

callbacks.add(
	'livechat.afterForwardChatToAgent',
	async (params) => {
		const { rid, oldServedBy } = params;
		if (!settings.get('Livechat_webhook_on_forward')) {
			return params;
		}

		const originalRoom = await LivechatRooms.findOneById(rid);
		if (!originalRoom) {
			return params;
		}

		const room = Object.assign(originalRoom, { oldServedBy });
		await sendToCRM('LivechatSessionForwarded', room);
		return params;
	},
	callbacks.priority.MEDIUM,
	'livechat-send-crm-room-forwarded-to-agent',
);

callbacks.add(
	'livechat.afterForwardChatToDepartment',
	async (params) => {
		const { rid, oldDepartmentId } = params;
		if (!settings.get('Livechat_webhook_on_forward')) {
			return params;
		}

		const originalRoom = await LivechatRooms.findOneById(rid);
		if (!originalRoom) {
			return params;
		}

		const room = Object.assign(originalRoom, { oldDepartmentId });
		await sendToCRM('LivechatSessionForwarded', room);
		return params;
	},
	callbacks.priority.MEDIUM,
	'livechat-send-crm-room-forwarded-to-department',
);

callbacks.add(
	'livechat.saveInfo',
	async (room) => {
		// Do not send to CRM if the chat is still open
		if (!isOmnichannelRoom(room) || room.open) {
			return room;
		}

		return sendToCRM('LivechatEdit', room);
	},
	callbacks.priority.MEDIUM,
	'livechat-send-crm-save-info',
);

callbacks.add(
	'afterOmnichannelSaveMessage',
	async (message, { room }) => {
		// if the message has a token, it was sent from the visitor
		// if not, it was sent from the agent
		if (message.token && !settings.get('Livechat_webhook_on_visitor_message')) {
			return message;
		}
		if (!message.token && !settings.get('Livechat_webhook_on_agent_message')) {
			return message;
		}
		// if the message has a type means it is a special message (like the closing comment), so skips
		// unless the settings that handle with visitor navigation history are enabled
		if (message.t && !sendMessageType(message.t)) {
			return message;
		}

		await sendToCRM('Message', room, [message]);
		return message;
	},
	callbacks.priority.MEDIUM,
	'livechat-send-crm-message',
);

callbacks.add(
	'livechat.leadCapture',
	(room) => {
		if (!settings.get('Livechat_webhook_on_capture')) {
			return room;
		}
		return sendToCRM('LeadCapture', room, false);
	},
	callbacks.priority.MEDIUM,
	'livechat-send-crm-lead-capture',
);
