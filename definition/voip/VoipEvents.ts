import { ICallerInfo } from './ICallerInfo';

type VoipEventKeys =
	| 'registered'
	| 'registrationerror'
	| 'unregistered'
	| 'unregistrationerror'
	| 'connected'
	| 'connectionerror'
	| 'callestablished'
	| 'callterminated'
	| 'hold'
	| 'holderror'
	| 'muteerror'
	| 'unhold'
	| 'unholderror'
	| 'stateChanged';

export type VoipEvents = {
	[key in VoipEventKeys]: undefined;
} & { incomingcall: ICallerInfo };
