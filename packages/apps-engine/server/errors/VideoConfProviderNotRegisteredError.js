"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoConfProviderNotRegisteredError = void 0;
class VideoConfProviderNotRegisteredError {
    constructor(providerName) {
        this.name = 'VideoConfProviderNotRegistered';
        this.message = `The video conference provider "${providerName}" is not registered in the system.`;
    }
}
exports.VideoConfProviderNotRegisteredError = VideoConfProviderNotRegisteredError;
//# sourceMappingURL=VideoConfProviderNotRegisteredError.js.map