import type { CallContact, CallHangupReason, CallNotification, CallRole, CallService } from './call';
export type MediaSignalNewCall = {
    callId: string;
    type: 'new';
    service: CallService;
    kind: 'direct';
    role: CallRole;
    contact: CallContact;
};
export type MediaSignalSDP = {
    callId: string;
    contractId: string;
    type: 'sdp';
    sdp: RTCSessionDescriptionInit;
};
export type MediaSignalRequestOffer = {
    callId: string;
    contractId: string;
    type: 'request-offer';
    iceRestart?: boolean;
};
export type MediaSignalError = {
    callId: string;
    contractId: string;
    type: 'error';
    errorCode: string;
};
export type MediaSignalAnswer = {
    callId: string;
    type: 'answer';
    contractId: string;
    answer: 'accept' | 'reject' | 'ack' | 'unavailable';
};
export type MediaSignalHangup = {
    callId: string;
    contractId: string;
    type: 'hangup';
    reason: CallHangupReason;
};
export type MediaSignalNotification = {
    callId: string;
    contractId?: string;
    type: 'notification';
    notification: CallNotification;
};
type ExtractMediaSignal<T, K> = T extends {
    type: K;
} ? T : never;
export type AnyMediaSignal = MediaSignalError | MediaSignalAnswer | MediaSignalHangup | MediaSignalSDP | MediaSignalNewCall | MediaSignalRequestOffer | MediaSignalNotification;
export type MediaSignalType = AnyMediaSignal['type'];
export type MediaSignal<K extends MediaSignalType = MediaSignalType> = ExtractMediaSignal<AnyMediaSignal, K>;
export type AgentMediaSignal = MediaSignal<'error' | 'answer' | 'hangup' | 'sdp'>;
export type ServerMediaSignal = MediaSignal<'sdp' | 'new' | 'request-offer' | 'notification'>;
export type AgentMediaSignalType = AgentMediaSignal['type'];
export type ServerMediaSignalType = ServerMediaSignal['type'];
type RemoveContractId<T extends MediaSignal> = T extends {
    contractId: string;
} ? Omit<T, 'contractId'> : T;
export type MediaSignalBody<K extends MediaSignalType = MediaSignalType> = Omit<RemoveContractId<MediaSignal<K>>, 'callId' | 'type'>;
export type MediaSignalBodyAndType<K extends MediaSignalType = MediaSignalType> = Omit<RemoveContractId<MediaSignal<K>>, 'callId'>;
export {};
//# sourceMappingURL=MediaSignal.d.ts.map