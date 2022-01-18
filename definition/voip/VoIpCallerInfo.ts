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
			state: 'OFFER_RECEIVED';
			userState: UserState;
			callerInfo: ICallerInfo;
	  }
	| {
			state: 'IN_CALL';
			userState: UserState;
			callerInfo: ICallerInfo;
	  }
	| {
			state: 'ON_HOLD';
			userState: UserState;
			callerInfo: ICallerInfo;
	  }; // TODO: Check for additional properties and States (E.g. call on hold, muted, etc)
