import { CallStates } from './CallStates';
import { ICallerInfo } from './ICallerInfo';
import { UserState } from './UserState';

export interface IState {
	isReady: boolean;
	enableVideo: boolean;
}

export type CallableStates = 'IN_CALL' | 'OFFER_RECEIVED' | 'ON_HOLD';

export type VoIpCallerInfo =
	| {
			state: Exclude<CallStates, CallableStates>;
			userState: UserState;
	  }
	| {
			state: CallableStates;
			userState: UserState;
			caller: ICallerInfo;
	  }; // TODO: Check for additional properties and States (E.g. call on hold, muted, etc)
