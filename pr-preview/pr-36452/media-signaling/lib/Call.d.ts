import { Emitter } from '@rocket.chat/emitter';
import type { MediaSignalTransportWrapper } from './TransportWrapper';
import type { IWebRTCProcessor } from '../definition/IWebRTCProcessor';
import type { MediaSignal, MediaSignalType } from '../definition/MediaSignal';
import type { IClientMediaCall, IClientMediaCallData, CallEvents, CallContact, CallRole, CallState, CallService } from '../definition/call';
export interface IClientMediaCallConfig {
    transporter: MediaSignalTransportWrapper;
    webrtcProcessor: IWebRTCProcessor;
}
export declare class ClientMediaCall implements IClientMediaCall {
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
    get service(): CallService;
    private transporter;
    private webrtcProcessor;
    private firstSignal;
    private acceptedLocally;
    private endedLocally;
    constructor(config: IClientMediaCallConfig, signal: MediaSignal<'new'>, { ignored, contact }?: Pick<IClientMediaCallData, 'ignored' | 'contact'>);
    getRemoteMediaStream(): MediaStream;
    setContact(contact: CallContact): void;
    processSignal<T extends MediaSignalType>(signal: MediaSignal<T>): Promise<void>;
    accept(): Promise<void>;
    reject(): Promise<void>;
    hangup(): Promise<void>;
    isPendingAcceptance(): boolean;
    private initialize;
    private changeState;
    private processOfferRequest;
    private processAnswerRequest;
    private processRemoteSDP;
    private deliverSdp;
    private processNotification;
    private flagAsAccepted;
    private flagAsEnded;
}
//# sourceMappingURL=Call.d.ts.map