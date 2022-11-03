export type VoipPropagatedEvents =
	| 'agentcalled'
	| 'agentconnected'
	| 'callerjoined'
	| 'queuememberadded'
	| 'queuememberremoved'
	| 'callabandoned';

export type VoipEventDataSignature =
	| {
			event: 'agent-called';
			data: { callerId: { id: string; name: string }; queue: string };
	  }
	| {
			event: 'agent-connected';
			data: { queue: string; queuedCalls: string; waitTimeInQueue: string };
	  }
	| {
			event: 'caller-joined';
			data: { callerId: { id: string; name: string }; queue: string; queuedCalls: string };
	  }
	| {
			event: 'queue-member-added';
			data: { queue: string; queuedCalls: string };
	  }
	| {
			event: 'queue-member-removed';
			data: { queue: string; queuedCalls: string };
	  }
	| {
			event: 'call-abandoned';
			data: { queuedCallAfterAbandon: string; queue: string };
	  };

export const isVoipEventAgentCalled = (
	data: VoipEventDataSignature,
): data is { event: 'agent-called'; data: { callerId: { id: string; name: string }; queue: string } } => data.event === 'agent-called';
export const isVoipEventAgentConnected = (
	data: VoipEventDataSignature,
): data is { event: 'agent-connected'; data: { queue: string; queuedCalls: string; waitTimeInQueue: string } } =>
	data.event === 'agent-connected';
export const isVoipEventCallerJoined = (
	data: VoipEventDataSignature,
): data is { event: 'caller-joined'; data: { callerId: { id: string; name: string }; queue: string; queuedCalls: string } } =>
	data.event === 'caller-joined';
export const isVoipEventQueueMemberAdded = (
	data: VoipEventDataSignature,
): data is { event: 'queue-member-added'; data: { queue: string; queuedCalls: string } } => data.event === 'queue-member-added';
export const isVoipEventQueueMemberRemoved = (
	data: VoipEventDataSignature,
): data is { event: 'queue-member-removed'; data: { queue: string; queuedCalls: string } } => data.event === 'queue-member-removed';
export const isVoipEventCallAbandoned = (
	data: VoipEventDataSignature,
): data is { event: 'call-abandoned'; data: { queuedCallAfterAbandon: string; queue: string } } => data.event === 'call-abandoned';
