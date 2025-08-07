import type { CallAnswer, CallHangupReason, CallService } from '../../call';
export type ClientMediaSignalRequestCall = {
    callId: string;
    contractId: string;
    type: 'request-call';
    callee: {
        type: 'user' | 'sip';
        id: string;
    };
    supportedServices: CallService[];
};
export type ClientMediaSignalLocalSDP = {
    callId: string;
    contractId: string;
    type: 'local-sdp';
    sdp: RTCSessionDescriptionInit;
};
export type ClientMediaSignalError = {
    callId: string;
    contractId: string;
    type: 'error';
    errorCode: string;
};
export type ClientMediaSignalAnswer = {
    callId: string;
    type: 'answer';
    contractId: string;
    answer: CallAnswer;
};
export type ClientMediaSignalHangup = {
    callId: string;
    contractId: string;
    type: 'hangup';
    reason: CallHangupReason;
};
export type ClientMediaSignal = ClientMediaSignalLocalSDP | ClientMediaSignalError | ClientMediaSignalAnswer | ClientMediaSignalHangup | ClientMediaSignalRequestCall;
export type ClientMediaSignalType = ClientMediaSignal['type'];
type ExtractMediaSignal<T, K extends ClientMediaSignalType> = T extends {
    type: K;
} ? T : never;
export type GenericClientMediaSignal<K extends ClientMediaSignalType> = ExtractMediaSignal<ClientMediaSignal, K>;
export type ClientMediaSignalBody<K extends ClientMediaSignalType = ClientMediaSignalType> = Omit<GenericClientMediaSignal<K>, 'callId' | 'contractId' | 'type'>;
export {};
//# sourceMappingURL=MediaSignal.d.ts.map