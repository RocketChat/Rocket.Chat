import type { ICloudWorkspaceRead } from './ICloudWorkspaceRead';
import type { IEnvironmentRead } from './IEnvironmentRead';
import type { ILivechatRead } from './ILivechatRead';
import type { IMessageRead } from './IMessageRead';
import type { INotifier } from './INotifier';
import type { IOAuthAppsReader } from './IOAuthAppsReader';
import type { IPersistenceRead } from './IPersistenceRead';
import type { IRoleRead } from './IRoleRead';
import type { IRoomRead } from './IRoomRead';
import type { IThreadRead } from './IThreadRead';
import type { IUploadRead } from './IUploadRead';
import type { IUserRead } from './IUserRead';
import type { IVideoConferenceRead } from './IVideoConferenceRead';

/**
 * The IRead accessor provides methods for accessing the
 * Rocket.Chat's environment in a read-only-fashion.
 * It is safe to be injected in multiple places, idempotent and extensible
 */
export interface IRead {
    /** Gets the IEnvironmentRead instance, contains settings and environmental variables. */
    getEnvironmentReader(): IEnvironmentRead;

    /** Gets the IThreadRead instance */

    getThreadReader(): IThreadRead;

    /** Gets the IMessageRead instance. */
    getMessageReader(): IMessageRead;

    /** Gets the IPersistenceRead instance. */
    getPersistenceReader(): IPersistenceRead;

    /** Gets the IRoomRead instance. */
    getRoomReader(): IRoomRead;

    /** Gets the IUserRead instance. */
    getUserReader(): IUserRead;

    /** Gets the INotifier for notifying users/rooms. */
    getNotifier(): INotifier;

    getLivechatReader(): ILivechatRead;
    getUploadReader(): IUploadRead;
    getCloudWorkspaceReader(): ICloudWorkspaceRead;

    getVideoConferenceReader(): IVideoConferenceRead;

    getOAuthAppsReader(): IOAuthAppsReader;

    getRoleReader(): IRoleRead;
}
