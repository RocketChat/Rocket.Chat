import { LivechatDepartment } from '@rocket.chat/models';

import { transformMappedData } from './transformMappedData';

export class AppDepartmentsConverter {
	constructor(orch) {
		this.orch = orch;
	}

	async convertById(id) {
		const department = await LivechatDepartment.findOneById(id);

		return this.convertDepartment(department);
	}

	async convertDepartment(department) {
		if (!department) {
			return undefined;
		}

		const map = {
			id: '_id',
			name: 'name',
			email: 'email',
			updatedAt: '_updatedAt',
			enabled: 'enabled',
			numberOfAgents: 'numAgents',
			showOnOfflineForm: 'showOnOfflineForm',
			description: 'description',
			offlineMessageChannelName: 'offlineMessageChannelName',
			requestTagBeforeClosingChat: 'requestTagBeforeClosingChat',
			chatClosingTags: 'chatClosingTags',
			abandonedRoomsCloseCustomMessage: 'abandonedRoomsCloseCustomMessage',
			waitingQueueMessage: 'waitingQueueMessage',
			departmentsAllowedToForward: 'departmentsAllowedToForward',
			showOnRegistration: 'showOnRegistration',
		};

		return transformMappedData(department, map);
	}

	convertAppDepartment(department) {
		if (!department) {
			return undefined;
		}

		const newDepartment = {
			_id: department.id,
			name: department.name,
			email: department.email,
			_updatedAt: department.updatedAt,
			enabled: department.enabled,
			numAgents: department.numberOfAgents,
			showOnOfflineForm: department.showOnOfflineForm,
			showOnRegistration: department.showOnRegistration,
			description: department.description,
			offlineMessageChannelName: department.offlineMessageChannelName,
			requestTagBeforeClosingChat: department.requestTagBeforeClosingChat,
			chatClosingTags: department.chatClosingTags,
			abandonedRoomsCloseCustomMessage: department.abandonedRoomsCloseCustomMessage,
			waitingQueueMessage: department.waitingQueueMessage,
			departmentsAllowedToForward: department.departmentsAllowedToForward,
		};

		return Object.assign(newDepartment, department._unmappedProperties_);
	}
}
