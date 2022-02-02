export interface IEventBase {
	event: string;
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
	queue: string;
	interface: string;
	membername: string;
	holdtime: string;
}

export interface IAgentConnectEvent extends IEventBase {
	event: 'AgentConnect';
}

export interface IAgentCalledEvent extends IEventBase {
	event: 'AgentCalled';
}

export interface IQueueCallerJoinEvent extends IEventBase {
	event: 'QueueCallerJoin';
	count: string;
}

export const isIAgentConnectEvent = (v: any): v is IAgentConnectEvent => v?.event === 'AgentConnect';
export const isIAgentCalledEvent = (v: any): v is IAgentCalledEvent => v?.event === 'AgentCalled';
export const isIQueueCallerJoinEvent = (v: any): v is IQueueCallerJoinEvent => v?.event === 'QueueCallerJoin';
