"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoConferenceExtender = void 0;
const metadata_1 = require("../../definition/metadata");
const Utilities_1 = require("../misc/Utilities");
class VideoConferenceExtender {
    constructor(videoConference) {
        this.videoConference = videoConference;
        this.kind = metadata_1.RocketChatAssociationModel.VIDEO_CONFERENCE;
    }
    setProviderData(value) {
        this.videoConference.providerData = value;
        return this;
    }
    setStatus(value) {
        this.videoConference.status = value;
        return this;
    }
    setEndedBy(value) {
        this.videoConference.endedBy = {
            _id: value,
            // Name and username will be loaded automatically by the bridge
            username: '',
            name: '',
        };
        return this;
    }
    setEndedAt(value) {
        this.videoConference.endedAt = value;
        return this;
    }
    addUser(userId, ts) {
        this.videoConference.users.push({
            _id: userId,
            ts,
            // Name and username will be loaded automatically by the bridge
            username: '',
            name: '',
        });
        return this;
    }
    setDiscussionRid(rid) {
        this.videoConference.discussionRid = rid;
        return this;
    }
    getVideoConference() {
        return Utilities_1.Utilities.deepClone(this.videoConference);
    }
}
exports.VideoConferenceExtender = VideoConferenceExtender;
//# sourceMappingURL=VideoConferenceExtend.js.map