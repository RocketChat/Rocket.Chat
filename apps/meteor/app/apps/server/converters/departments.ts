import { IDepartment } from '@rocket.chat/apps-engine/definition/livechat';
import type { ILivechatDepartment } from '@rocket.chat/core-typings';

import LivechatDepartment from '../../../models/server/models/LivechatDepartment';
import { transformMappedData } from '../../lib/misc/transformMappedData';
import { AppServerOrchestrator } from '../orchestrator';

export class AppDepartmentsConverter {
	orch: AppServerOrchestrator;

	constructor(orch: AppServerOrchestrator) {
		this.orch = orch;
	}

	convertById(id: string):
		| {
				_unmappedProperties_: unknown;
		  }
		| undefined {
		const department = LivechatDepartment.findOneById(id);

		return this.convertDepartment(department);
	}

	convertDepartment(department: IDepartment):
		| {
				_unmappedProperties_: unknown;
		  }
		| undefined {
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

	convertAppDepartment(department: IDepartment): ILivechatDepartment | undefined {
		if (!department) {
			return undefined;
		}

		return {
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
			...(department as any)._unmappedProperties_,
		};
	}
}
