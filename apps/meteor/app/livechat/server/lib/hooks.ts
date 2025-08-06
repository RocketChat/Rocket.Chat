import { ILivechatAgentStatus } from '@rocket.chat/core-typings';

import type {

	AtLeast,
	ILivechatDepartment,
	IOmnichannelRoom,
	IOmnichannelRoomExtraData,
	IOmnichannelRoomInfo,
	IOmnichannelSource,
	IUser,
	SelectedAgent,
	InquiryWithAgentInfo,
	ILivechatInquiryRecord,
} from '@rocket.chat/core-typings';
import { LivechatContacts, LivechatDepartmentAgents, LivechatVisitors, Users } from '@rocket.chat/models';
import { makeFunction } from '@rocket.chat/patch-injection';

import { setUserStatusLivechat } from './utils';
import { callbacks } from '../../../../lib/callbacks';
import { notifyOnLivechatDepartmentAgentChangedByDepartmentId } from '../../../lib/server/lib/notifyListener';
import { settings } from '../../../settings/server';
import { sendToCRM } from '../hooks/sendToCRM';

export async function afterAgentUserActivated(user: IUser) {
	if (!user.roles.includes('livechat-agent')) {
		throw new Error('invalid-user-role');
	}
	callbacks.runAsync('livechat.onNewAgentCreated', user._id);
}

export async function afterAgentAdded(user: IUser) {
	await setUserStatusLivechat(user._id, user.status !== 'offline' ? ILivechatAgentStatus.AVAILABLE : ILivechatAgentStatus.NOT_AVAILABLE);
	callbacks.runAsync('livechat.onNewAgentCreated', user._id);

	return user;
}

export async function afterRemoveAgent(user: AtLeast<IUser, '_id' | 'username'>) {
	await callbacks.run('livechat.afterAgentRemoved', { agent: user });
	return true;
}

export async function afterDepartmentArchived(department: AtLeast<ILivechatDepartment, '_id' | 'businessHourId'>) {
	await LivechatDepartmentAgents.disableAgentsByDepartmentId(department._id);

	void notifyOnLivechatDepartmentAgentChangedByDepartmentId(department._id);

	await callbacks.run('livechat.afterDepartmentArchived', department);
}

export async function afterDepartmentUnarchived(department: AtLeast<ILivechatDepartment, '_id' | 'businessHourId'>) {
	await LivechatDepartmentAgents.enableAgentsByDepartmentId(department._id);

	void notifyOnLivechatDepartmentAgentChangedByDepartmentId(department._id);
}

export const checkDefaultAgentOnNewRoom = makeFunction(
	async (defaultAgent?: SelectedAgent, _params?: { visitorId?: string; source?: IOmnichannelSource }) => defaultAgent,
);

export const beforeDelegateAgent = async (
	agent: SelectedAgent | undefined,
	{ department }: { department?: string } = {},
): Promise<SelectedAgent | null | undefined> => {
	if (agent) {
		return agent;
	}

	if (!settings.get('Livechat_assign_new_conversation_to_bot')) {
		return null;
	}

	if (department) {
		return LivechatDepartmentAgents.getNextBotForDepartment(department);
	}

	return Users.getNextBotAgent();
};

export const beforeNewRoom = makeFunction(
	async (roomInfo: IOmnichannelRoomInfo, _extraData?: IOmnichannelRoomExtraData): Promise<Partial<IOmnichannelRoom>> => roomInfo,
);

export const onNewRoom = makeFunction(async (room: IOmnichannelRoom) => {
	const {
		_id,
		v: { _id: guestId },
		source,
		contactId,
	} = room;

	const lastChat = {
		_id,
		ts: new Date(),
	};

	await Promise.all([
		LivechatVisitors.setLastChatById(guestId, lastChat),
		contactId
			? LivechatContacts.updateLastChatById(
					contactId,
					{
						visitorId: guestId,
						source,
					},
					lastChat,
				)
			: undefined,
	]);

	if (settings.get('Livechat_webhook_on_start')) {
		await sendToCRM('LivechatSessionStart', room);
	}
});

export const afterTakeInquiry = makeFunction(
	async ({ room }: { inquiry: InquiryWithAgentInfo; room: IOmnichannelRoom; agent: { agentId: string; username: string } }) => {
		if (!settings.get('Livechat_webhook_on_chat_taken')) {
			return;
		}
		await sendToCRM('LivechatSessionTaken', room);
	},
);

export const afterInquiryQueued = makeFunction(async (_inquiry: ILivechatInquiryRecord) => {
	return void 0;
});

export const afterRoomQueued = makeFunction((room: IOmnichannelRoom) => {
	if (!settings.get('Livechat_webhook_on_chat_queued')) {
		return;
	}

	return sendToCRM('LivechatSessionQueued', room);
});

export const beforeRouteChat = makeFunction(
	async (inquiry: ILivechatInquiryRecord, _agent?: SelectedAgent | null): Promise<ILivechatInquiryRecord | null | undefined> => {
		return inquiry;
	},
);
