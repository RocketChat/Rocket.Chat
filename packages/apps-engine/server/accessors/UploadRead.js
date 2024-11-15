"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadRead = void 0;
class UploadRead {
    constructor(uploadBridge, appId) {
        this.uploadBridge = uploadBridge;
        this.appId = appId;
    }
    getById(id) {
        return this.uploadBridge.doGetById(id, this.appId);
    }
    getBuffer(upload) {
        return this.uploadBridge.doGetBuffer(upload, this.appId);
    }
    getBufferById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const upload = yield this.uploadBridge.doGetById(id, this.appId);
            return this.uploadBridge.doGetBuffer(upload, this.appId);
        });
    }
}
exports.UploadRead = UploadRead;
//# sourceMappingURL=UploadRead.js.map