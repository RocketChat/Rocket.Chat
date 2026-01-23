import type { ILivechatDepartment, Serialized, ILivechatDepartmentAgents } from '@rocket.chat/core-typings';

import type { EditDepartmentProps } from '../EditDepartment';

type InitialValueParams = {
	department?: Serialized<ILivechatDepartment> | null;
	agents?: Serialized<ILivechatDepartmentAgents>[];
	allowedToForwardData?: EditDepartmentProps['allowedToForwardData'];
};

function withDefault<T>(key: T | undefined | null, defaultValue: T) {
	return key || defaultValue;
}

export const getFormInitialValues = ({ department, agents, allowedToForwardData }: InitialValueParams) => ({
	name: withDefault(department?.name, ''),
	email: withDefault(department?.email, ''),
	description: withDefault(department?.description, ''),
	enabled: !!department?.enabled,
	maxNumberSimultaneousChat: department?.maxNumberSimultaneousChat,
	showOnRegistration: !!department?.showOnRegistration,
	showOnOfflineForm: !!department?.showOnOfflineForm,
	abandonedRoomsCloseCustomMessage: withDefault(department?.abandonedRoomsCloseCustomMessage, ''),
	requestTagBeforeClosingChat: !!department?.requestTagBeforeClosingChat,
	offlineMessageChannelName: withDefault(department?.offlineMessageChannelName, ''),
	visitorInactivityTimeoutInSeconds: department?.visitorInactivityTimeoutInSeconds,
	waitingQueueMessage: withDefault(department?.waitingQueueMessage, ''),
	departmentsAllowedToForward: allowedToForwardData?.departments?.map((dep) => ({ label: dep.name, value: dep._id })) || [],
	fallbackForwardDepartment: withDefault(department?.fallbackForwardDepartment, ''),
	chatClosingTags: department?.chatClosingTags ?? [],
	agentList: agents || [],
	allowReceiveForwardOffline: withDefault(department?.allowReceiveForwardOffline, false),
	unit: withDefault(department?.ancestors?.[0], ''), // NOTE: A department should only have one ancestor
});
