import { CallStates } from './CallStates';
import { ICallerInfo } from './ICallerInfo';
import { UserState } from './UserState';

export interface IState {
	isReady: boolean;
	enableVideo: boolean;
}

export type VoIpCallerInfo = {
	state: CallStates;
	userState: UserState;
	callerInfo?: ICallerInfo;
};
