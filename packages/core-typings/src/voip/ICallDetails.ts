import type { ICallerInfo } from './ICallerInfo';
import type { UserState } from './UserState';

export interface ICallDetails {
	callInfo?: ICallerInfo;
	userState: UserState;
}
