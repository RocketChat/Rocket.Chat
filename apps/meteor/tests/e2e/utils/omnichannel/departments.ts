import { faker } from '@faker-js/faker';
import { ILivechatDepartment } from '@rocket.chat/core-typings';

import { BaseTest } from '../test';

type CreateDepartmentParams = { name?: string; maxNumberSimultaneousChat?: number };

export const createDepartment = async (api: BaseTest['api'], { name = '', maxNumberSimultaneousChat }: CreateDepartmentParams = {}) => {
	const response = await api.post('/livechat/department', {
		department: {
			name: name || faker.string.uuid(),
			enabled: true,
			description: '',
			showOnRegistration: false,
			showOnOfflineForm: false,
			requestTagBeforeClosingChat: false,
			email: faker.internet.email(),
			chatClosingTags: [],
			offlineMessageChannelName: '',
			abandonedRoomsCloseCustomMessage: '',
			waitingQueueMessage: '',
			departmentsAllowedToForward: [],
			fallbackForwardDepartment: '',
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
