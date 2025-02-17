"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoConferenceBuilder = void 0;
const metadata_1 = require("../../definition/metadata");
class VideoConferenceBuilder {
    constructor(data) {
        this.kind = metadata_1.RocketChatAssociationModel.VIDEO_CONFERENCE;
        this.call = (data || {});
    }
    setData(data) {
        this.call = {
            rid: data.rid,
            createdBy: data.createdBy,
            providerName: data.providerName,
            title: data.title,
            discussionRid: data.discussionRid,
        };
        return this;
    }
    setRoomId(rid) {
        this.call.rid = rid;
        return this;
    }
    getRoomId() {
        return this.call.rid;
    }
    setCreatedBy(userId) {
        this.call.createdBy = userId;
        return this;
    }
    getCreatedBy() {
        return this.call.createdBy;
    }
    setProviderName(userId) {
        this.call.providerName = userId;
        return this;
    }
    getProviderName() {
        return this.call.providerName;
    }
    setProviderData(data) {
        this.call.providerData = data;
        return this;
    }
    getProviderData() {
        return this.call.providerData;
    }
    setTitle(userId) {
        this.call.title = userId;
        return this;
    }
    getTitle() {
        return this.call.title;
    }
    setDiscussionRid(rid) {
        this.call.discussionRid = rid;
        return this;
    }
    getDiscussionRid() {
        return this.call.discussionRid;
    }
    getVideoConference() {
        return this.call;
    }
}
exports.VideoConferenceBuilder = VideoConferenceBuilder;
//# sourceMappingURL=VideoConferenceBuilder.js.map