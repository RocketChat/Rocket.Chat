import type { CallFeature, CallFlag, CallService, CallState } from '../IClientMediaCall';
import type { IClientMediaCallLocalParticipant, IClientMediaCallRemoteParticipant } from '../IClientMediaCallParticipant';
import type { CallContact } from '../common';

export interface IDirectMediaCallData {
	readonly confirmed: true;

	readonly callId: string;
	readonly service: CallService | null;
	readonly flags: readonly CallFlag[];
	readonly features: readonly CallFeature[];
	readonly state: CallState;
	readonly hidden: boolean;

	readonly transferredBy: CallContact | null;

	readonly activeTimestamp?: Date;

	readonly tempCallId: string;

	readonly localParticipant: IClientMediaCallLocalParticipant;
	readonly remoteParticipant: IClientMediaCallRemoteParticipant;
}
