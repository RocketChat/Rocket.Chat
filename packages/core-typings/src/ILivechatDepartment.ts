export interface ILivechatDepartment {
	_id: string;
	name: string;
	enabled: boolean;
	description?: string;
	showOnRegistration: boolean;
	showOnOfflineForm: boolean;
	requestTagBeforeClosingChat?: boolean;
	email: string;
	chatClosingTags?: string[];
	offlineMessageChannelName: string;
	numAgents: number;
	_updatedAt?: Date;
	businessHourId?: string;
	fallbackForwardDepartment?: string;
	archived?: boolean;
	departmentsAllowedToForward?: string[];
	maxNumberSimultaneousChat?: number;
	parentId?: string;
	ancestors?: string[];
	allowReceiveForwardOffline?: boolean;
	// extra optional fields
	[k: string]: any;
}

export type LivechatDepartmentDTO = {
	enabled: boolean;
	name: string;
	description?: string | undefined;
	showOnRegistration: boolean;
	email: string;
	showOnOfflineForm: boolean;
	requestTagBeforeClosingChat?: boolean | undefined;
	chatClosingTags?: string[] | undefined;
	fallbackForwardDepartment?: string | undefined;
	departmentsAllowedToForward?: string[] | undefined;
	allowReceiveForwardOffline?: boolean;
	offlineMessageChannelName?: string | undefined;
	abandonedRoomsCloseCustomMessage?: string | undefined;
	waitingQueueMessage?: string | undefined;
};
