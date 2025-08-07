import type { CallRejectedReason } from '../../call';

export type ServerMediaSignalRejectedCallRequest = {
	callId: string;
	type: 'rejected-call-request';
	toContractId: string;
	reason?: CallRejectedReason;
};
