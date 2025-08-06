import { Emitter } from '@rocket.chat/emitter';
import type { IServiceProcessorFactoryList } from '../definition/IServiceProcessorFactoryList';
import type { MediaSignal } from '../definition/MediaSignal';
import type { MediaSignalAgentTransport } from '../definition/MediaSignalTransport';
import type { MediaStreamFactory } from '../definition/MediaStreamFactory';
import type { IClientMediaCall, CallState } from '../definition/call';
export type MediaSignalingEvents = {
    callContactUpdate: {
        call: IClientMediaCall;
    };
    callStateChange: {
        call: IClientMediaCall;
        oldState: CallState;
    };
    newCall: {
        call: IClientMediaCall;
    };
    acceptedCall: {
        call: IClientMediaCall;
    };
    endedCall: {
        call: IClientMediaCall;
    };
};
export type MediaSignalingSessionConfig = {
    userId: string;
    processorFactories: IServiceProcessorFactoryList;
    mediaStreamFactory: MediaStreamFactory;
    transport: MediaSignalAgentTransport;
};
export declare class MediaSignalingSession extends Emitter<MediaSignalingEvents> {
    private config;
    private _userId;
    private readonly _sessionId;
    private knownCalls;
    private ignoredCalls;
    private transporter;
    get sessionId(): string;
    get userId(): string;
    constructor(config: MediaSignalingSessionConfig);
    isBusy(): boolean;
    getCallData(callId: string): IClientMediaCall | null;
    getMainCall(): IClientMediaCall | null;
    processSignal(signal: MediaSignal): Promise<void>;
    registerOutboundCall(callId: string, contact: Record<string, string>): Promise<void>;
    private isSignalTargetingAnotherSession;
    private isCallIgnored;
    private ignoreCall;
    private getOrCreateCall;
}
//# sourceMappingURL=Session.d.ts.map