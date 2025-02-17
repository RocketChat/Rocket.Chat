"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoConferenceRead = void 0;
class VideoConferenceRead {
    constructor(videoConfBridge, appId) {
        this.videoConfBridge = videoConfBridge;
        this.appId = appId;
    }
    getById(id) {
        return this.videoConfBridge.doGetById(id, this.appId);
    }
}
exports.VideoConferenceRead = VideoConferenceRead;
//# sourceMappingURL=VideoConferenceRead.js.map