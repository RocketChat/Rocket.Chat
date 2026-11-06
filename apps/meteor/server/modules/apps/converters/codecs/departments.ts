import type { IAppsDepartment } from '@rocket.chat/apps';
import type { ILivechatDepartment } from '@rocket.chat/core-typings';
import * as z from 'zod';

import { mappedDecode } from './mappedData';

/**
 * Rocket.Chat `ILivechatDepartment` <-> Apps-Engine `IAppsDepartment`.
 *
 * `decode` is a plain field-rename with an `_unmappedProperties_` bucket (mirrors the legacy
 * `convertDepartment`). `encode` mirrors `convertAppDepartment`: the inverse rename written
 * unconditionally, then `_unmappedProperties_` merged on top.
 */
export const DepartmentCodec = z.codec(z.custom<ILivechatDepartment>(), z.custom<IAppsDepartment>(), {
	decode: mappedDecode<ILivechatDepartment>({
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
	}) as unknown as (department: ILivechatDepartment) => IAppsDepartment,
	encode: (department): ILivechatDepartment => {
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

		return Object.assign(
			newDepartment,
			(department as { _unmappedProperties_?: Record<string, unknown> })._unmappedProperties_,
		) as unknown as ILivechatDepartment;
	},
});
