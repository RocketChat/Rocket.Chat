import type { ICallerInfo } from './ICallerInfo';

export type VoipEvents = {
	registered: undefined;
	registrationerror: unknown;
	unregistered: undefined;
	unregistrationerror: unknown;
	connected: undefined;
	connectionerror: unknown;
	callestablished: undefined;
	incomingcall: ICallerInfo;
	callterminated: undefined;
	hold: undefined;
	holderror: undefined;
	muteerror: undefined;
	unhold: undefined;
	unholderror: undefined;
	stateChanged: undefined;
};
