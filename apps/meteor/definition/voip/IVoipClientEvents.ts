export type VoipPropagatedEvents =
	| 'agentcalled'
	| 'agentconnected'
	| 'callerjoined'
	| 'queuememberadded'
	| 'queuememberremoved'
	| 'callabandoned';

export type VoipEventDataSignature =
	| {
			event: 'agentcalled';
			data: { callerId: { id: string; name: string }; queue: string };
	  }
	| {
			event: 'agentconnected';
			data: { queue: string; queuedCalls: string; waitTimeInQueue: string };
	  }
	| {
			event: 'callerjoined';
			data: { callerId: { id: string; name: string }; queue: string; queuedCalls: string };
	  }
	| {
			event: 'queuememberadded';
			data: { queue: string; queuedCalls: string };
	  }
	| {
			event: 'queuememberremoved';
			data: { queue: string; queuedCalls: string };
	  }
	| {
			event: 'callabandoned';
			data: { queuedCallAfterAbandon: string; queue: string };
	  };

export const isVoipEventAgentCalled = (data: VoipEventDataSignature): data is { event: 'agentcalled'; data: { callerId: { id: string; name: string }; queue: string } } => data.event === 'agentcalled';
export const isVoipEventAgentConnected = (data: VoipEventDataSignature): data is { event: 'agentconnected'; data: { queue: string; queuedCalls: string; waitTimeInQueue: string } } => data.event === 'agentconnected';
export const isVoipEventCallerJoined = (data: VoipEventDataSignature): data is { event: 'callerjoined'; data: { callerId: { id: string; name: string }; queue: string; queuedCalls: string } } => data.event === 'callerjoined';
export const isVoipEventQueueMemberAdded = (data: VoipEventDataSignature): data is { event: 'queuememberadded'; data: { queue: string; queuedCalls: string } } => data.event === 'queuememberadded';
export const isVoipEventQueueMemberRemoved = (data: VoipEventDataSignature): data is { event: 'queuememberremoved'; data: { queue: string; queuedCalls: string } } => data.event === 'queuememberremoved';
export const isVoipEventCallAbandoned = (data: VoipEventDataSignature): data is { event: 'callabandoned'; data: { queuedCallAfterAbandon: string; queue: string } } => data.event === 'callabandoned';
