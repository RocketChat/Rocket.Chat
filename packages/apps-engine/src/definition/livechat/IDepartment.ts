/**
 * A group of Livechat agents a conversation can be routed to.
 *
 * Most of these fields are the department's own answer to a workspace-wide
 * Livechat setting.
 */
export interface IDepartment {
	/** The department's identifier. */
	id: string;
	/** The department's name, which visitors see when they choose one. */
	name?: string;
	/** The address the department's own email conversations arrive at. */
	email?: string;
	/** What the department handles. */
	description?: string;
	/** The channel that receives the messages left while nobody is available. */
	offlineMessageChannelName?: string;
	/** Whether an agent has to tag a conversation before closing it. */
	requestTagBeforeClosingChat?: false;
	/** The tags an agent may pick from when closing a conversation. */
	chatClosingTags?: Array<string>;
	/** What to post when a conversation is closed for having been abandoned. */
	abandonedRoomsCloseCustomMessage?: string;
	/** What to tell a visitor waiting in the queue. */
	waitingQueueMessage?: string;
	/** The departments a conversation here may be forwarded to. */
	departmentsAllowedToForward?: string;
	/** Whether the department takes conversations at all. */
	enabled: boolean;
	/** When the department last changed. */
	updatedAt: Date;
	/** How many agents belong to the department. */
	numberOfAgents: number;
	/** Whether a visitor may pick this department when nobody is available. */
	showOnOfflineForm: boolean;
	/** Whether a visitor may pick this department when starting a conversation. */
	showOnRegistration: boolean;
}
