import type { CallRejectedReason } from '../../call/index.js';

export type ServerMediaSignalRejectedCallRequest = {
	callId: string;
	type: 'rejected-call-request';
	toContractId: string;
	reason: CallRejectedReason;
};
