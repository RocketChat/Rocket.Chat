import type { CallStates } from './CallStates';
import type { ICallerInfo } from './ICallerInfo';
import type { UserState } from './UserState';

export interface IState {
	isReady: boolean;
	enableVideo: boolean;
}

export type VoIpCallerInfo =
	| {
			state: Exclude<CallStates, 'IN_CALL' | 'OFFER_RECEIVED' | 'ON_HOLD' | 'OFFER_SENT'>;
			userState: UserState;
	  }
	| {
			state: 'IN_CALL' | 'ON_HOLD' | 'OFFER_RECEIVED' | 'OFFER_SENT';
			userState: UserState;
			caller: ICallerInfo;
	  }; // TODO: Check for additional properties and States (E.g. call on hold, muted, etc)
