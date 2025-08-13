import { Stream } from './Stream';
export class RemoteStream extends Stream {
    setTrack(newTrack, _peer) {
        if (this.mediaStream.getTrackById(newTrack.id)) {
            return;
        }
        if (newTrack.kind !== 'audio') {
            return;
        }
        this.mediaStream.getAudioTracks().forEach((track) => {
            track.stop();
            this.mediaStream.removeTrack(track);
        });
        this.mediaStream.addTrack(newTrack);
    }
}
//# sourceMappingURL=RemoteStream.js.map