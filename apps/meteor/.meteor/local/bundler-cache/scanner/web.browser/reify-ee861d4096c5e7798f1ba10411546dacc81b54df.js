module.export({default:()=>LocalStream});let defaultMediaStreamFactory;module.link('sip.js/lib/platform/web',{defaultMediaStreamFactory(v){defaultMediaStreamFactory=v}},0);let Stream;module.link('./Stream',{default(v){Stream=v}},1);/**
 * This class is used for local stream manipulation.
 * @remarks
 * This class does not really store any local stream for the reason
 * that the local stream tracks are stored in the peer connection.
 *
 * This simply provides necessary methods for stream manipulation.
 *
 * Currently it does not use any of its base functionality. Nevertheless
 * there might be a need that we may want to do some stream operations
 * such as closing of tracks, in future. For that purpose, it is written
 * this way.
 *
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};


class LocalStream extends Stream {
    static requestNewStream(constraints, session) {
        return __awaiter(this, void 0, void 0, function* () {
            const factory = defaultMediaStreamFactory();
            if (session === null || session === void 0 ? void 0 : session.sessionDescriptionHandler) {
                return factory(constraints, session.sessionDescriptionHandler);
            }
        });
    }
    static replaceTrack(peerConnection, newStream, mediaType) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            const senders = peerConnection.getSenders();
            if (!senders) {
                return false;
            }
            /**
             * This will be called when media device change happens.
             * This needs to be called externally when the device change occurs.
             * This function first acquires the new stream based on device selection
             * and then replaces the track in the sender of existing stream by track acquired
             * by caputuring new stream.
             *
             * Notes:
             * Each sender represents a track in the RTCPeerConnection.
             * Peer connection will contain single track for
             * each, audio, video and data.
             * Furthermore, We are assuming that
             * newly captured stream will have a single track for each media type. i.e
             * audio video and data. But this assumption may not be true atleast in theory. One may see multiple
             * audio track in the captured stream or multiple senders for same kind in the peer connection
             * If/When such situation arrives in future, we may need to revisit the track replacement logic.
             * */
            switch (mediaType) {
                case 'audio': {
                    let replaced = false;
                    const newTracks = newStream.getAudioTracks();
                    if (!newTracks) {
                        console.warn('replaceTrack() : No audio tracks in the stream. Returning');
                        return false;
                    }
                    for (let i = 0; i < (senders === null || senders === void 0 ? void 0 : senders.length); i++) {
                        if (((_a = senders[i].track) === null || _a === void 0 ? void 0 : _a.kind) === 'audio') {
                            senders[i].replaceTrack(newTracks[0]);
                            replaced = true;
                            break;
                        }
                    }
                    return replaced;
                }
                case 'video': {
                    let replaced = false;
                    const newTracks = newStream.getVideoTracks();
                    if (!newTracks) {
                        console.warn('replaceTrack() : No video tracks in the stream. Returning');
                        return false;
                    }
                    for (let i = 0; i < (senders === null || senders === void 0 ? void 0 : senders.length); i++) {
                        if (((_b = senders[i].track) === null || _b === void 0 ? void 0 : _b.kind) === 'video') {
                            senders[i].replaceTrack(newTracks[0]);
                            replaced = true;
                            break;
                        }
                    }
                    return replaced;
                }
                default: {
                    let replaced = false;
                    const newTracks = newStream.getVideoTracks();
                    if (!newTracks) {
                        console.warn('replaceTrack() : No tracks in the stream. Returning');
                        return false;
                    }
                    for (let i = 0; i < (senders === null || senders === void 0 ? void 0 : senders.length); i++) {
                        for (let j = 0; j < newTracks.length; j++) {
                            if (((_c = senders[i].track) === null || _c === void 0 ? void 0 : _c.kind) === newTracks[j].kind) {
                                senders[i].replaceTrack(newTracks[j]);
                                replaced = true;
                                break;
                            }
                        }
                    }
                    return replaced;
                }
            }
        });
    }
}
//# sourceMappingURL=LocalStream.js.map