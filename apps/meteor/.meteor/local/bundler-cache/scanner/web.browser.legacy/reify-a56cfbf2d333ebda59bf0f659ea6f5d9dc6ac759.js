"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isE2EEUpload = void 0;
const isE2EEUpload = (upload) => Boolean(upload?.content?.ciphertext && upload?.content?.algorithm);
exports.isE2EEUpload = isE2EEUpload;
//# sourceMappingURL=IUpload.js.map