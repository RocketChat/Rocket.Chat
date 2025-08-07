import type { CallContact, CallNotification, CallRole, CallService } from '../../call';
export type ServerMediaSignalNewCall = {
    callId: string;
    type: 'new';
    service: CallService;
    kind: 'direct';
    role: CallRole;
    contact: CallContact;
    requestedCallId?: string;
};
export type ServerMediaSignalRemoteSDP = {
    callId: string;
    toContractId: string;
    type: 'remote-sdp';
    sdp: RTCSessionDescriptionInit;
};
export type ServerMediaSignalRequestOffer = {
    callId: string;
    toContractId: string;
    type: 'request-offer';
    iceRestart?: boolean;
};
export type ServerMediaSignalNotification = {
    callId: string;
    type: 'notification';
    notification: CallNotification;
};
export type ServerMediaSignal = ServerMediaSignalNewCall | ServerMediaSignalRemoteSDP | ServerMediaSignalRequestOffer | ServerMediaSignalNotification;
export type ServerMediaSignalType = ServerMediaSignal['type'];
//# sourceMappingURL=MediaSignal.d.ts.map