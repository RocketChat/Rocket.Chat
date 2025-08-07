import type { CallContact, CallNotification, CallRejectedReason, CallRole, CallService } from '../../call';
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
export type ServerMediaSignalRejectedCallRequest = {
    callId: string;
    type: 'rejected-call-request';
    toContractId: string;
    reason?: CallRejectedReason;
};
export type ServerMediaSignal = ServerMediaSignalNewCall | ServerMediaSignalRemoteSDP | ServerMediaSignalRequestOffer | ServerMediaSignalNotification | ServerMediaSignalRejectedCallRequest;
export type ServerMediaSignalType = ServerMediaSignal['type'];
//# sourceMappingURL=MediaSignal.d.ts.map