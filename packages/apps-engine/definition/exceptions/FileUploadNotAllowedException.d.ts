import { AppsEngineException } from './AppsEngineException';
/**
 * This exception informs the host system that an
 * app has determined that a file upload is not
 * allowed to be completed.
 *
 * Currently it is expected to be thrown by the
 * following events:
 * - IPreFileUpload
 */
export declare class FileUploadNotAllowedException extends AppsEngineException {
}
