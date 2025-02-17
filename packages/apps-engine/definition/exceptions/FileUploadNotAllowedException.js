"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileUploadNotAllowedException = void 0;
const AppsEngineException_1 = require("./AppsEngineException");
/**
 * This exception informs the host system that an
 * app has determined that a file upload is not
 * allowed to be completed.
 *
 * Currently it is expected to be thrown by the
 * following events:
 * - IPreFileUpload
 */
class FileUploadNotAllowedException extends AppsEngineException_1.AppsEngineException {
}
exports.FileUploadNotAllowedException = FileUploadNotAllowedException;
//# sourceMappingURL=FileUploadNotAllowedException.js.map