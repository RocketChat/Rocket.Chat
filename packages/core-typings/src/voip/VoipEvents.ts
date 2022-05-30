import type { ICallerInfo } from '@rocket.chat/core-typings/src/voip/ICallerInfo';
import type { ICallDetails } from './ICallDetails'

export type VoipEvents = {
	registered: undefined;
	registrationerror: unknown;
	unregistered: undefined;
	unregistrationerror: unknown;
	connected: undefined;
	connectionerror: unknown;
	callestablished: ICallDetails;
	incomingcall: ICallerInfo;
	callterminated: undefined;
	hold: undefined;
	holderror: undefined;
	muteerror: undefined;
	unhold: undefined;
	unholderror: undefined;
	stateChanged: undefined;
};
