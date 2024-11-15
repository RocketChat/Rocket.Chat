"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoConfProviderAlreadyExistsError = void 0;
class VideoConfProviderAlreadyExistsError {
    constructor(name) {
        this.name = 'VideoConfProviderAlreadyExists';
        this.message = `The video conference provider "${name}" was already registered by another App.`;
    }
}
exports.VideoConfProviderAlreadyExistsError = VideoConfProviderAlreadyExistsError;
//# sourceMappingURL=VideoConfProviderAlreadyExistsError.js.map