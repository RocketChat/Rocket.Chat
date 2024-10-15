import type { IModerationModify } from './IModerationModify';
import type { IModifyCreator } from './IModifyCreator';
import type { IModifyDeleter } from './IModifyDeleter';
import type { IModifyExtender } from './IModifyExtender';
import type { IModifyUpdater } from './IModifyUpdater';
import type { INotifier } from './INotifier';
import type { IOAuthAppsModify } from './IOAuthAppsModify';
import type { ISchedulerModify } from './ISchedulerModify';
import type { IUIController } from './IUIController';

export interface IModify {
    getCreator(): IModifyCreator;

    getDeleter(): IModifyDeleter;

    getExtender(): IModifyExtender;

    getUpdater(): IModifyUpdater;

    /**
     * Gets the accessor for sending notifications to a user or users in a room.
     *
     * @returns the notifier accessor
     */
    getNotifier(): INotifier;
    /**
     * Gets the accessor for interacting with the UI
     */
    getUiController(): IUIController;

    /**
     * Gets the accessor for creating scheduled jobs
     */
    getScheduler(): ISchedulerModify;

    /**
     * Gets the accessor for creating OAuth apps
     */
    getOAuthAppsModifier(): IOAuthAppsModify;
    /**
     * Gets the accessor for modifying moderation
     * @returns the moderation accessor
     */
    getModerationModifier(): IModerationModify;
}
