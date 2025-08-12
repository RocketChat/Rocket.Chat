import { Emitter } from '@rocket.chat/emitter';
import type { IWebRTCProcessor, WebRTCInternalStateMap, WebRTCProcessorConfig, WebRTCProcessorEvents } from '../../../definition';
import type { ServiceStateValue } from '../../../definition/services/IServiceProcessor';
export declare class MediaCallWebRTCProcessor implements IWebRTCProcessor {
    private readonly config;
    emitter: Emitter<WebRTCProcessorEvents>;
    private peer;
    private iceGatheringFinished;
    private iceGatheringTimedOut;
    private localStream;
    private localMediaStream;
    private localMediaStreamInitialized;
    private remoteStream;
    private remoteMediaStream;
    private iceGatheringWaiters;
    constructor(config: WebRTCProcessorConfig);
    getRemoteMediaStream(): MediaStream;
    createOffer({ iceRestart }: {
        iceRestart?: boolean;
    }): Promise<{
        sdp: RTCSessionDescriptionInit;
    }>;
    createAnswer({ sdp }: {
        sdp: RTCSessionDescriptionInit;
    }): Promise<{
        sdp: RTCSessionDescriptionInit;
    }>;
    setRemoteDescription({ sdp }: {
        sdp: RTCSessionDescriptionInit;
    }): Promise<void>;
    getInternalState<K extends keyof WebRTCInternalStateMap>(stateName: K): ServiceStateValue<WebRTCInternalStateMap, K>;
    protected getuserMedia(constraints: MediaStreamConstraints): Promise<MediaStream>;
    private changeInternalState;
    private getLocalDescription;
    private waitForIceGathering;
    private registerPeerEvents;
    private restartIce;
    private onIceCandidate;
    private onIceCandidateError;
    private onNegotiationNeeded;
    private onTrack;
    private onConnectionStateChange;
    private onIceConnectionStateChange;
    private onSignalingStateChange;
    private onIceGatheringStateChange;
    private initializeLocalMediaStream;
    private onIceGatheringComplete;
    private clearIceGatheringData;
    private clearIceGatheringWaiters;
}
//# sourceMappingURL=Processor.d.ts.map