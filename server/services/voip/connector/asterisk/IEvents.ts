export interface IEventBase {
	event: string;
}
/**  Not all events will contain following
 * fields. In the minimal, every event will contain
 * event name.
 *
 * As we move further in handling different events, we will
 * refactor this class. For the time being, we will take a simple
 * of everything deriving from IEventBase.
 *
 * IQueueEvent represents all the queue events which have the parameters
 * listed below.
 */
export interface IQueueEvent extends IEventBase {
	privilege: string;
	systemname: string;
	channel: string;
	channelstate: string;
	channelstatedesc: 'Up' | 'Down';
	calleridnum: string;
	calleridname: string;
	connectedlinenum: string;
	connectedlinename: string;
	language: string;
	accountcode: string;
	context: string;
	exten: string;
	priority: string;
	uniqueid: string;
	linkedid: string;
	destchannel: string;
	destchannelstate: string;
	destcalleridnum: string;
	destcalleridname: string;
	destconnectedlinenum: string;
	destconnectedlinename: string;
	destlanguage: string;
	destaccountcode: string;
	destcontext: string;
	destexten: string;
	destpriority: string;
	destuniqueid: string;
	destlinkedid: string;
	membername: string;
	holdtime: string;
	queue: string;
	interface: string;
}

export interface IAgentConnectEvent extends IQueueEvent {
	event: 'AgentConnect';
}

export interface IAgentCalledEvent extends IQueueEvent {
	event: 'AgentCalled';
}

export interface IQueueCallerJoinEvent extends IQueueEvent {
	event: 'QueueCallerJoin';
	count: string;
}

export interface IQueueMemberAdded extends IEventBase {
	event: 'QueueMemberAdded';
	queue: string;
	interface: string;
}

export interface IQueueMemberRemoved extends IEventBase {
	event: 'QueueMemberRemoved';
	queue: string;
	interface: string;
}

export interface IQueueCallerAbandon extends IEventBase {
	event: 'QueueCallerAbandon';
	queuename: string;
}

export const isIAgentConnectEvent = (v: any): v is IAgentConnectEvent => v?.event === 'AgentConnect';
export const isIAgentCalledEvent = (v: any): v is IAgentCalledEvent => v?.event === 'AgentCalled';
export const isIQueueCallerJoinEvent = (v: any): v is IQueueCallerJoinEvent => v?.event === 'QueueCallerJoin';
export const isIQueueMemberAddedEvent = (v: any): v is IQueueMemberAdded => v?.event === 'QueueMemberAdded';
export const isIQueueMemberRemovedEvent = (v: any): v is IQueueMemberRemoved => v?.event === 'QueueMemberRemoved';
export const isIQueueCallerAbandonEvent = (v: any): v is IQueueMemberRemoved => v?.event === 'QueueCallerAbandon';
