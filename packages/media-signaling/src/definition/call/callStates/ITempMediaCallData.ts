import type { CallState } from '../IClientMediaCall';
import type { IClientMediaCallLocalParticipant } from '../IClientMediaCallParticipant';

export interface ITempMediaCallData {
	readonly confirmed: false;
	readonly tempCallId: string;

	readonly state: CallState;

	readonly title: string;

	readonly localParticipant: IClientMediaCallLocalParticipant;
}
