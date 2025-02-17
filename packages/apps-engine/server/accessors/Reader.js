"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Reader = void 0;
class Reader {
    constructor(env, message, persist, room, user, noti, livechat, upload, cloud, videoConf, contactRead, oauthApps, thread, role) {
        this.env = env;
        this.message = message;
        this.persist = persist;
        this.room = room;
        this.user = user;
        this.noti = noti;
        this.livechat = livechat;
        this.upload = upload;
        this.cloud = cloud;
        this.videoConf = videoConf;
        this.contactRead = contactRead;
        this.oauthApps = oauthApps;
        this.thread = thread;
        this.role = role;
    }
    getEnvironmentReader() {
        return this.env;
    }
    getThreadReader() {
        return this.thread;
    }
    getMessageReader() {
        return this.message;
    }
    getPersistenceReader() {
        return this.persist;
    }
    getRoomReader() {
        return this.room;
    }
    getUserReader() {
        return this.user;
    }
    getNotifier() {
        return this.noti;
    }
    getLivechatReader() {
        return this.livechat;
    }
    getUploadReader() {
        return this.upload;
    }
    getCloudWorkspaceReader() {
        return this.cloud;
    }
    getVideoConferenceReader() {
        return this.videoConf;
    }
    getOAuthAppsReader() {
        return this.oauthApps;
    }
    getRoleReader() {
        return this.role;
    }
    getContactReader() {
        return this.contactRead;
    }
}
exports.Reader = Reader;
//# sourceMappingURL=Reader.js.map