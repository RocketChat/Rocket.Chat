import type { Emitter } from '@rocket.chat/emitter';
import type { CallEvents } from './CallEvents';
export type CallActorType = 'user' | 'sip';
export type CallContact = {
    type?: CallActorType;
    id?: string;
    displayName?: string;
    username?: string;
    sipExtension?: string;
    avatarUrl?: string;
    host?: string;
};
export type CallRole = 'caller' | 'callee';
export type CallService = 'webrtc';
export type CallState = 'none' | 'ringing' | 'accepted' | 'active' | 'hangup';
export type CallHangupReason = 'normal' | 'remote' | 'rejected' | 'unavailable' | 'timeout' | 'signaling-error' | 'service-error' | 'media-error' | 'error';
export type CallAnswer = 'accept' | 'reject' | 'ack' | 'unavailable';
export type CallNotification = 'accepted' | 'hangup';
export interface IClientMediaCallData {
    callId: string;
    role: CallRole;
    service: CallService | null;
    state?: CallState;
    ignored?: boolean;
    contact?: CallContact;
}
export interface IClientMediaCall extends Required<IClientMediaCallData> {
    emitter: Emitter<CallEvents>;
    getRemoteMediaStream(): MediaStream;
    accept(): Promise<void>;
    reject(): Promise<void>;
    hangup(): Promise<void>;
}
//# sourceMappingURL=IClientMediaCall.d.ts.map