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

export type SelectedAgent = { agentId: string; username: string };
export interface IRoutingMethod {
	getNextAgent(departmentId?: string, ignoreAgentId?: string): Promise<SelectedAgent | null | undefined>;
}
