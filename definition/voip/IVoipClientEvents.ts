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
