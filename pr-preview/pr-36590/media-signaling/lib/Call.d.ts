import { Emitter } from '@rocket.chat/emitter';
import type { MediaSignalTransportWrapper } from './TransportWrapper';
import type { IServiceProcessorFactoryList } from '../definition';
import type { IWebRTCProcessor } from '../definition/IWebRTCProcessor';
import type { MediaSignal } from '../definition/MediaSignal';
import type { IClientMediaCall, CallEvents, CallContact, CallRole, CallState, CallService, CallHangupReason } from '../definition/call';
import type { MediaStreamFactory } from '../definition/MediaStreamFactory';
export interface IClientMediaCallConfig {
    transporter: MediaSignalTransportWrapper;
    processorFactories: IServiceProcessorFactoryList;
    mediaStreamFactory: MediaStreamFactory;
}
type ClientState = 'pending' | 'accepting' | 'accepted' | 'has-offer' | 'has-answer' | 'active' | 'hangup';
export declare class ClientMediaCall implements IClientMediaCall {
    private readonly config;
    readonly callId: string;
    readonly emitter: Emitter<CallEvents>;
    private _role;
    get role(): CallRole;
    private _state;
    get state(): CallState;
    private _ignored;
    get ignored(): boolean;
    private _contact;
    get contact(): CallContact;
    private _service;
    get service(): CallService | null;
    protected webrtcProcessor: IWebRTCProcessor | null;
    private acceptedLocally;
    private endedLocally;
    private hasRemoteData;
    private hasLocalDescription;
    private hasRemoteDescription;
    private initialized;
    private acknowledged;
    private earlySignals;
    private stateTimeoutHandlers;
    constructor(config: IClientMediaCallConfig, callId: string);
    initializeOutboundCall(contact: CallContact): Promise<void>;
    initializeRemoteCall(signal: MediaSignal<'new'>): Promise<void>;
    getClientState(): ClientState;
    getRemoteMediaStream(): MediaStream;
    processSignal(signal: MediaSignal): Promise<void>;
    accept(): Promise<void>;
    reject(): Promise<void>;
    hangup(reason?: CallHangupReason): Promise<void>;
    isPendingAcceptance(): boolean;
    isPendingOurAcceptance(): boolean;
    isOver(): boolean;
    private changeState;
    private changeContact;
    protected processOfferRequest(signal: MediaSignal<'request-offer'>): Promise<void>;
    protected shouldIgnoreWebRTC(): boolean;
    protected processAnswerRequest(signal: MediaSignal<'sdp'>): Promise<void>;
    protected processRemoteSDP(signal: MediaSignal<'sdp'>): Promise<void>;
    protected deliverSdp(sdp: {
        sdp: RTCSessionDescriptionInit;
    }): Promise<void>;
    protected rejectAsUnavailable(): Promise<void>;
    protected processEarlySignals(): Promise<void>;
    protected acknowledge(): void;
    private processNotification;
    private flagAsAccepted;
    private flagAsEnded;
    private addStateTimeout;
    private updateStateTimeouts;
    private prepareWebRtcProcessor;
    private requireWebRTC;
}
export declare class ClientMediaCallWebRTC extends ClientMediaCall {
    webrtcProcessor: IWebRTCProcessor;
    constructor(config: IClientMediaCallConfig, callId: string);
}
export {};
//# sourceMappingURL=Call.d.ts.map