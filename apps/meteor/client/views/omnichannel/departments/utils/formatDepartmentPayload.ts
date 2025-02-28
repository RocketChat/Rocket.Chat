import type { IDepartmentAgent } from '../EditDepartment';

export type FormValues = {
	name: string;
	email: string;
	description: string;
	enabled: boolean;
	maxNumberSimultaneousChat: number;
	showOnRegistration: boolean;
	showOnOfflineForm: boolean;
	abandonedRoomsCloseCustomMessage: string;
	requestTagBeforeClosingChat: boolean;
	offlineMessageChannelName: string;
	visitorInactivityTimeoutInSeconds: number;
	waitingQueueMessage: string;
	departmentsAllowedToForward: { label: string; value: string }[];
	fallbackForwardDepartment: string;
	agentList: IDepartmentAgent[];
	chatClosingTags: string[];
	allowReceiveForwardOffline: boolean;
	unit?: string;
};

export const formatDepartmentPayload = (data: FormValues) => {
	const {
		enabled,
		name,
		description,
		showOnRegistration,
		showOnOfflineForm,
		email,
		chatClosingTags,
		offlineMessageChannelName,
		maxNumberSimultaneousChat,
		visitorInactivityTimeoutInSeconds,
		abandonedRoomsCloseCustomMessage,
		waitingQueueMessage,
		departmentsAllowedToForward,
		fallbackForwardDepartment,
		allowReceiveForwardOffline,
		requestTagBeforeClosingChat,
		unit,
	} = data;

	return {
		enabled,
		name,
		description,
		showOnRegistration,
		showOnOfflineForm,
		requestTagBeforeClosingChat,
		email,
		chatClosingTags,
		offlineMessageChannelName,
		maxNumberSimultaneousChat,
		visitorInactivityTimeoutInSeconds,
		abandonedRoomsCloseCustomMessage,
		waitingQueueMessage,
		departmentsAllowedToForward: departmentsAllowedToForward?.map((dep) => dep.value),
		fallbackForwardDepartment,
		allowReceiveForwardOffline,
		departmentUnit: { id: unit },
	};
};
