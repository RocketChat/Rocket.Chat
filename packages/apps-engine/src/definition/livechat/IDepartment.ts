export interface IDepartment {
    id: string;
    name?: string;
    email?: string;
    description?: string;
    offlineMessageChannelName?: string;
    requestTagBeforeClosingChat?: false;
    chatClosingTags?: Array<string>;
    abandonedRoomsCloseCustomMessage?: string;
    waitingQueueMessage?: string;
    departmentsAllowedToForward?: string;
    enabled: boolean;
    updatedAt: Date;
    numberOfAgents: number;
    showOnOfflineForm: boolean;
    showOnRegistration: boolean;
}
