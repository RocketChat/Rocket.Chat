import { Emitter } from '@rocket.chat/emitter';
import type { MediaSignalTransportWrapper } from './TransportWrapper';
import type { IServiceProcessorFactoryList } from '../definition';
import type { IClientMediaCall, CallEvents, CallContact, CallRole, CallState, CallService, CallHangupReason, CallActorType } from '../definition/call';
import type { ClientState } from '../definition/client';
import type { IWebRTCProcessor, MediaStreamFactory } from '../definition/services';
import type { ServerMediaSignal, ServerMediaSignalNewCall, ServerMediaSignalRemoteSDP, ServerMediaSignalRequestOffer } from '../definition/signals/server/MediaSignal';
export interface IClientMediaCallConfig {
    transporter: MediaSignalTransportWrapper;
    processorFactories: IServiceProcessorFactoryList;
    mediaStreamFactory: MediaStreamFactory;
}
export declare class ClientMediaCall implements IClientMediaCall {
    private readonly config;
    get callId(): string;
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
    private remoteCallId;
    private oldClientState;
    private serviceStates;
    private stateReporterTimeoutHandler;
    private mayReportStates;
    private localCallId;
    constructor(config: IClientMediaCallConfig, callId: string);
    initializeOutboundCall(contact: CallContact): Promise<void>;
    requestCall(callee: {
        type: CallActorType;
        id: string;
    }, contactInfo?: CallContact): Promise<void>;
    initializeRemoteCall(signal: ServerMediaSignalNewCall): Promise<void>;
    getClientState(): ClientState;
    getRemoteMediaStream(): MediaStream;
    processSignal(signal: ServerMediaSignal): Promise<void>;
    accept(): Promise<void>;
    reject(): Promise<void>;
    hangup(reason?: CallHangupReason): Promise<void>;
    isPendingAcceptance(): boolean;
    isPendingOurAcceptance(): boolean;
    isOver(): boolean;
    private changeState;
    private updateClientState;
    private changeContact;
    protected processOfferRequest(signal: ServerMediaSignalRequestOffer): Promise<void>;
    protected shouldIgnoreWebRTC(): boolean;
    protected processAnswerRequest(signal: ServerMediaSignalRemoteSDP): Promise<void>;
    protected processRemoteSDP(signal: ServerMediaSignalRemoteSDP): Promise<void>;
    protected deliverSdp(data: {
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
    private onWebRTCInternalStateChange;
    private reportStates;
    private clearStateReporter;
    private requestStateReport;
    private prepareWebRtcProcessor;
    private requireWebRTC;
}
export declare class ClientMediaCallWebRTC extends ClientMediaCall {
    webrtcProcessor: IWebRTCProcessor;
    constructor(config: IClientMediaCallConfig, callId: string);
}
//# sourceMappingURL=Call.d.ts.map