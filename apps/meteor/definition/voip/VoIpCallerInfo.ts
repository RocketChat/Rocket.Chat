import { CallStates } from './CallStates';
import { ICallerInfo } from './ICallerInfo';
import { UserState } from './UserState';

export interface IState {
	isReady: boolean;
	enableVideo: boolean;
}

export type VoIpCallerInfo =
	| {
			state: Exclude<CallStates, 'IN_CALL' | 'OFFER_RECEIVED' | 'ON_HOLD'>;
			userState: UserState;
	  }
	| {
			state: 'IN_CALL' | 'ON_HOLD' | 'OFFER_RECEIVED';
			userState: UserState;
			caller: ICallerInfo;
	  }; // TODO: Check for additional properties and States (E.g. call on hold, muted, etc)
