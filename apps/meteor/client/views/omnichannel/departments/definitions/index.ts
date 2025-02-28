import type { ILivechatDepartmentAgents } from '@rocket.chat/core-typings';

export type IDepartmentAgent = Pick<ILivechatDepartmentAgents, 'agentId' | 'username' | 'count' | 'order'> & {
	_id?: string;
	name?: string;
};

export type EditDepartmentFormData = {
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
