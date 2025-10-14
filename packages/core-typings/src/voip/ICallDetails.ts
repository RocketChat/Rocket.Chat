import type { ICallerInfo } from './ICallerInfo';
import type { VoIPUserState } from './VoIPUserState';

export interface ICallDetails {
	callInfo?: ICallerInfo;
	userState: VoIPUserState;
}
