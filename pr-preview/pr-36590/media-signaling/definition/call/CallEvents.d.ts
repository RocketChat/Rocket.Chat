import type { ClientState } from '../client';
import type { CallState } from './IClientMediaCall';
export type CallEvents = {
    stateChange: CallState;
    clientStateChange: ClientState;
    contactUpdate: void;
    initialized: void;
    accepting: void;
    accepted: void;
    active: void;
    hidden: void;
    ended: void;
};
//# sourceMappingURL=CallEvents.d.ts.map