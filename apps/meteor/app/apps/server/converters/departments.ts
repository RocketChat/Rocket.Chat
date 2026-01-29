import type { IAppDepartmentsConverter, IAppsDepartment, IAppServerOrchestrator } from '@rocket.chat/apps';
import type { ILivechatDepartment } from '@rocket.chat/core-typings';
import { LivechatDepartment } from '@rocket.chat/models';

import { transformMappedData } from './transformMappedData';

export class AppDepartmentsConverter implements IAppDepartmentsConverter {
	constructor(public orch: IAppServerOrchestrator) {}

	async convertById(departmentId: ILivechatDepartment['_id']): Promise<IAppsDepartment | undefined> {
		const department = await LivechatDepartment.findOneById(departmentId);

		return this.convertDepartment(department);
	}

	convertDepartment(department: undefined | null): Promise<undefined>;

	convertDepartment(department: ILivechatDepartment): Promise<IAppsDepartment>;

	convertDepartment(department: ILivechatDepartment | undefined | null): Promise<IAppsDepartment | undefined>;

	async convertDepartment(department: ILivechatDepartment | undefined | null): Promise<IAppsDepartment | undefined> {
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

	convertAppDepartment(department: undefined | null): undefined;

	convertAppDepartment(department: IAppsDepartment): ILivechatDepartment;

	convertAppDepartment(department: IAppsDepartment | undefined | null): ILivechatDepartment | undefined;

	convertAppDepartment(department: IAppsDepartment | undefined | null): ILivechatDepartment | undefined {
		if (!department) {
			return undefined;
		}

		const newDepartment: ILivechatDepartment = {
			_id: department.id,
			name: department.name!,
			email: department.email!,
			_updatedAt: department.updatedAt,
			enabled: department.enabled,
			numAgents: department.numberOfAgents,
			showOnOfflineForm: department.showOnOfflineForm,
			showOnRegistration: department.showOnRegistration,
			description: department.description,
			offlineMessageChannelName: department.offlineMessageChannelName!,
			requestTagBeforeClosingChat: department.requestTagBeforeClosingChat,
			chatClosingTags: department.chatClosingTags,
			abandonedRoomsCloseCustomMessage: department.abandonedRoomsCloseCustomMessage,
			waitingQueueMessage: department.waitingQueueMessage,
			departmentsAllowedToForward: department.departmentsAllowedToForward,
		};

		return Object.assign(newDepartment, (department as { _unmappedProperties_?: any })._unmappedProperties_);
	}
}
