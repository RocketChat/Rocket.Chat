import type { CallContact, CallRole, CallService } from '../../call';
export type ServerMediaSignalNewCall = {
    callId: string;
    type: 'new';
    service: CallService;
    kind: 'direct';
    role: CallRole;
    contact: CallContact;
    requestedCallId?: string;
};
//# sourceMappingURL=new.d.ts.map