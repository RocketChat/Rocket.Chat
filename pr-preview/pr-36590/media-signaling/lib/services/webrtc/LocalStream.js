var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Stream } from './Stream';
export class LocalStream extends Stream {
    setTrack(newTrack, peer) {
        return __awaiter(this, void 0, void 0, function* () {
            if (newTrack.kind === 'video') {
                return;
            }
            if (newTrack.kind !== 'audio') {
                throw new Error('Unsupported track kind');
            }
            const sender = peer.getSenders().find((sender) => { var _a; return ((_a = sender.track) === null || _a === void 0 ? void 0 : _a.kind) === newTrack.kind; });
            if (!sender) {
                peer.addTrack(newTrack, this.mediaStream);
                this.mediaStream.addTrack(newTrack);
                return;
            }
            yield sender.replaceTrack(newTrack);
            const oldTrack = this.mediaStream.getTracks().find((localTrack) => localTrack.kind === newTrack.kind);
            if (oldTrack) {
                oldTrack.stop();
                this.mediaStream.removeTrack(oldTrack);
            }
            this.mediaStream.addTrack(newTrack);
        });
    }
    setStreamTracks(stream, peer) {
        return __awaiter(this, void 0, void 0, function* () {
            const audioTracks = stream.getAudioTracks();
            if (audioTracks.length) {
                yield this.setTrack(audioTracks[0], peer);
            }
        });
    }
}
//# sourceMappingURL=LocalStream.js.map