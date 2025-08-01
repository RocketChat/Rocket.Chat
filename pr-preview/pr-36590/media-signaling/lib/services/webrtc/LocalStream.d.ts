import { Stream } from './Stream';
export declare class LocalStream extends Stream {
    setTrack(newTrack: MediaStreamTrack, peer: RTCPeerConnection): Promise<void>;
    setStreamTracks(stream: MediaStream, peer: RTCPeerConnection): Promise<void>;
}
//# sourceMappingURL=LocalStream.d.ts.map