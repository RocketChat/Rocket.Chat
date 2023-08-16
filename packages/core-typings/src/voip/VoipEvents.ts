import type { ICallDetails } from './ICallDetails';
import type { ICallerInfo } from './ICallerInfo';

export type VoipEvents = {
	registered: undefined;
	registrationerror: unknown;
	unregistered: undefined;
	unregistrationerror: unknown;
	connected: undefined;
	connectionerror: unknown;
	callestablished: ICallDetails;
	incomingcall: ICallerInfo;
	callfailed: string;
	ringing: ICallDetails;
	callterminated: undefined;
	hold: undefined;
	holderror: undefined;
	muteerror: undefined;
	unhold: undefined;
	unholderror: undefined;
	stateChanged: undefined;
};
