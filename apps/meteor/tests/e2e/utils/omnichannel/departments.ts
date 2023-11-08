import { faker } from '@faker-js/faker';

import { BaseTest } from '../test';

export const createDepartment = async (api: BaseTest['api']) =>
	api.post('/livechat/department', {
		department: {
			name: faker.string.uuid(),
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
		},
	});

export const deleteDepartment = async (api: BaseTest['api'], { id }: { id: string }) => api.delete(`/livechat/department/${id}`);
