import type { CallHangupReason, CallRole, CallService } from './call';
export type MediaSignalHeader = {
    callId: string;
    sessionId?: string;
};
export type MediaSignalNewCall = {
    service: CallService;
    kind: 'direct';
    role: CallRole;
};
export type MediaSignalSDP = {
    sdp: RTCSessionDescriptionInit;
};
export type MediaSignalRequestOffer = {
    iceRestart?: boolean;
};
export type MediaSignalError = {
    errorCode: string;
};
export type MediaSignalAnswer = {
    answer: 'accept' | 'reject' | 'ack' | 'unavailable';
};
export type MediaSignalHangup = {
    reason: CallHangupReason;
};
export type MediaSignalNotification = {
    notification: 'accepted' | 'hangup';
};
export type MediaSignalMap = {
    'new': MediaSignalNewCall;
    'sdp': MediaSignalSDP;
    'request-offer': MediaSignalRequestOffer;
    'error': MediaSignalError;
    'answer': MediaSignalAnswer;
    'hangup': MediaSignalHangup;
    'notification': MediaSignalNotification;
};
export type MediaSignalType = keyof MediaSignalMap;
export type MediaSignalBody<T extends MediaSignalType = MediaSignalType> = MediaSignalMap[T];
export type MediaSignalBodyAndType<T extends MediaSignalType = MediaSignalType> = {
    type: T;
    body: MediaSignalBody<T>;
};
export type MediaSignal<T extends MediaSignalType = MediaSignalType> = MediaSignalHeader & MediaSignalBodyAndType<T>;
//# sourceMappingURL=MediaSignal.d.ts.map