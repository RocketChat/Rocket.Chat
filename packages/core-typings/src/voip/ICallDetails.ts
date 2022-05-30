import type { ICallerInfo } from "@rocket.chat/core-typings/src/voip/ICallerInfo";
import type { UserState} from "./UserState"

export interface ICallDetails {
	callInfo?: ICallerInfo,
	userState: UserState,
}

