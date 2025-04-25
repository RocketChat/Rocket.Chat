import type { ILivechatVisitor, IMessage, IOmnichannelRoomInfo } from '@rocket.chat/core-typings';
import { LivechatRooms, LivechatVisitors, Users } from '@rocket.chat/models';
import { v4 as uuidv4 } from 'uuid';

import type { RegisterGuestType } from './Visitors';
import { registerGuest } from './guests';
import { createRoom } from './rooms';
import { online } from './service-status';
import { callbacks } from '../../../../lib/callbacks';
import { sendMessage } from '../../../lib/server/functions/sendMessage';
import { settings } from '../../../settings/server';

const getVisitor = async (visitor: RegisterGuestType) => {
	if (visitor.token) {
		return LivechatVisitors.getVisitorByToken(visitor.token);
	}
	if (visitor.phone) {
		const { number } = visitor.phone;
		return LivechatVisitors.findOneVisitorByPhone(number);
	}
	// TODO get by email
};

export const defineVisitor = async (visitor: RegisterGuestType) => {
	const visitorFound = await getVisitor(visitor);
	if (visitorFound) {
		return visitorFound;
	}

	const { number } = visitor.phone || {};

	const livechatVisitor = await registerGuest({
		department: visitor.department,
		username: visitor.username,
		name: visitor.name,
		token: visitor.token || uuidv4(),
		email: visitor.email || '',
		...(number && { phone: { number } }),
	});

	if (!livechatVisitor) {
		throw new Error('error-invalid-visitor');
	}

	return livechatVisitor;
};

// TODO contactWaId should not be optional
const getRoom = async ({ token, departmentId, contactWaId }: { token: string; contactWaId?: string; departmentId?: string }) => {
	const extraQuery = await callbacks.run('livechat.applyRoomRestrictions', {});

	const cursor = departmentId
		? LivechatRooms.findOpenByVisitorTokenAndDepartmentId(token, departmentId, {}, extraQuery)
		: LivechatRooms.findOpenByVisitorToken(token, {}, extraQuery);

	for await (const room of cursor) {
		if (room.customFields?.whatsAppMessage?.contactWaId === contactWaId) {
			return room;
		}
	}
};

const getAgent = async (agentId: string) => {
	const user = await Users.getAgentInfo(agentId, settings.get('Livechat_show_agent_email'));
	if (!user) {
		throw new Error(`The agent with id "${agentId}" was not found.`);
	}
	return { agentId: user._id, username: user.username };
};

// { token: string; department?: string; contactWaId?: string }
export const defineRoom = async ({
	visitor,
	agentId,
	customFields,
	roomInfo,
}: {
	visitor: ILivechatVisitor & { contactWaId?: string };
	agentId?: string;
	customFields?: Record<string, unknown>;
	roomInfo: IOmnichannelRoomInfo;
}) => {
	const roomFound = await getRoom({ token: visitor.token, departmentId: visitor.department, contactWaId: visitor.contactWaId });
	if (roomFound) {
		return roomFound;
	}

	const room = await createRoom({
		visitor,
		roomInfo,
		...(agentId && { agent: await getAgent(agentId) }),
		extraData: customFields && { customFields },
	});

	return room;
};

export async function newIntegratorMessage({
	department,
	message,
	visitor,
	source,
}: {
	department?: string;
	message: IMessage;
	visitor: RegisterGuestType;
	source: IOmnichannelRoomInfo['source'];
}) {
	const visitorFound = await defineVisitor(visitor);
	if (!visitorFound) {
		throw new Error('error-invalid-visitor');
	}
	console.log('visitorFound ->', visitorFound);

	if (!(await online(department))) {
		throw new Error('error-department-not-online');
	}

	const room = await defineRoom({
		visitor: visitorFound,
		agentId: undefined,
		customFields: { department },
		roomInfo: {
			source,
		},
	});
	if (!room) {
		throw new Error('error-invalid-room');
	}

	console.log('room ->', room);

	const sentMessage = await sendMessage(visitorFound, { ...message, token: visitorFound.token }, room);

	console.log('sentMessage ->', sentMessage);

	return {
		visitor: visitorFound,
		room,
		sentMessage,
	};
}

// protected async createUpload(details: IUploadDetails, buffer: Buffer, appId: string): Promise<IUpload> {
// 	this.orch.debugLog(`The App ${appId} is creating an upload "${details.name}"`);

// 	if (!details.userId && !details.visitorToken) {
// 		throw new Error('Missing user to perform the upload operation');
// 	}

// 	const fileStore = FileUpload.getStore('Uploads');

// 	details.type = determineFileType(buffer, details.name);

// 	const uploadedFile = await fileStore.insert(getUploadDetails(details), buffer);
// 	this.orch.debugLog(`The App ${appId} has created an upload`, uploadedFile);
// 	if (details.visitorToken) {
// 		await sendFileLivechatMessage({ roomId: details.rid, visitorToken: details.visitorToken, file: uploadedFile });
// 	} else {
// 		await sendFileMessage(details.userId, { roomId: details.rid, file: uploadedFile });
// 	}
// 	return this.orch.getConverters()?.get('uploads').convertToApp(uploadedFile);
// }
