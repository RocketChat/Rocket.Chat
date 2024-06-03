import type { ILivechatDepartment } from '../ILivechatDepartment';

export interface IRoutingMethodConstructor {
	new (): IRoutingMethod;
}

export type RoutingMethodConfig = {
	previewRoom: boolean;
	showConnecting: boolean;
	showQueue: boolean;
	showQueueLink: boolean;
	returnQueue: boolean;
	enableTriggerAction: boolean;
	autoAssignAgent: boolean;
};

export type SelectedAgent = {
	agentId: string;
	username?: string;
};
export interface IRoutingMethod {
	getNextAgent(departmentId?: string, ignoreAgentId?: string): Promise<SelectedAgent | null | undefined>;
	config?: RoutingMethodConfig;
}

export type TransferData = {
	userId?: string;
	departmentId?: string;
	department?: Pick<ILivechatDepartment, '_id' | 'name'>;
	transferredBy: {
		_id: string;
		username?: string;
	};
	transferredTo?: {
		username?: string;
		name?: string;
	};
	clientAction?: boolean;
	scope?: 'agent' | 'department' | 'queue' | 'autoTransferUnansweredChatsToAgent' | 'autoTransferUnansweredChatsToQueue';
	comment?: string;
	hops?: number;
	usingFallbackDep?: boolean;
	originalDepartmentName?: string;
};

export type TransferByData = {
	_id: string;
	username?: string;
	name?: string;
	userType?: 'agent' | 'user' | 'visitor';
};
