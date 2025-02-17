"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoConfProviderExtend = void 0;
class VideoConfProviderExtend {
    constructor(manager, appId) {
        this.manager = manager;
        this.appId = appId;
    }
    provideVideoConfProvider(provider) {
        return Promise.resolve(this.manager.addProvider(this.appId, provider));
    }
}
exports.VideoConfProviderExtend = VideoConfProviderExtend;
//# sourceMappingURL=VideoConfProviderExtend.js.map