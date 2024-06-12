import { faker } from '@faker-js/faker';
import type { ILivechatDepartment } from '@rocket.chat/core-typings';

import type { BaseTest } from '../test';

type CreateDepartmentParams = {
	name?: string;
	enabled?: boolean;
	description?: string;
	showOnRegistration?: boolean;
	showOnOfflineForm?: boolean;
	requestTagBeforeClosingChat?: boolean;
	email?: string;
	chatClosingTags?: string[];
	offlineMessageChannelName?: string;
	abandonedRoomsCloseCustomMessage?: string;
	waitingQueueMessage?: string;
	departmentsAllowedToForward?: string[];
	fallbackForwardDepartment?: string;
	maxNumberSimultaneousChat?: number;
};

export const createDepartment = async (
	api: BaseTest['api'],
	{
		name = '',
		enabled = true,
		description = '',
		showOnRegistration = false,
		showOnOfflineForm = false,
		requestTagBeforeClosingChat = false,
		email = '',
		chatClosingTags = [],
		offlineMessageChannelName = '',
		abandonedRoomsCloseCustomMessage = '',
		waitingQueueMessage = '',
		departmentsAllowedToForward = [],
		fallbackForwardDepartment = '',
		maxNumberSimultaneousChat,
	}: CreateDepartmentParams = {},
) => {
	const response = await api.post('/livechat/department', {
		department: {
			name: name || faker.string.uuid(),
			enabled,
			description,
			showOnRegistration,
			showOnOfflineForm,
			requestTagBeforeClosingChat,
			email: email || faker.internet.email(),
			chatClosingTags,
			offlineMessageChannelName,
			abandonedRoomsCloseCustomMessage,
			waitingQueueMessage,
			departmentsAllowedToForward,
			fallbackForwardDepartment,
			maxNumberSimultaneousChat,
		},
	});

	if (response.status() !== 200) {
		throw Error(`Unable to create department [http status: ${response.status()}]`);
	}

	const { department } = await response.json();

	return {
		response,
		data: department,
		delete: async () => api.delete(`/livechat/department/${department._id}`),
	};
};

export const addAgentToDepartment = async (
	api: BaseTest['api'],
	{ department, agentId, username }: { department: ILivechatDepartment; agentId: string; username?: string },
) =>
	api.post(`/livechat/department/${department._id}/agents`, {
		remove: [],
		upsert: [
			{
				agentId,
				username: username || agentId,
				count: 0,
				order: 0,
			},
		],
	});

export const deleteDepartment = async (api: BaseTest['api'], { id }: { id: string }) => api.delete(`/livechat/department/${id}`);
