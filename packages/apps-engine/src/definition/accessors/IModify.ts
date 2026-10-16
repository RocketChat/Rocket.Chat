import type { IModerationModify } from './IModerationModify';
import type { IModifyCreator } from './IModifyCreator';
import type { IModifyDeleter } from './IModifyDeleter';
import type { IModifyExtender } from './IModifyExtender';
import type { IModifyUpdater } from './IModifyUpdater';
import type { INotifier } from './INotifier';
import type { IOAuthAppsModify } from './IOAuthAppsModify';
import type { ISchedulerModify } from './ISchedulerModify';
import type { IUIController } from './IUIController';

/**
 * Everything an App can change in the workspace.
 *
 * Handlers receive one of these. Which changes actually go through depends on
 * the App's permissions and on the handler: a `pre` handler returns its change,
 * while a `post` handler applies one.
 */
export interface IModify {
	/** Gets the accessor for creating new records. */
	getCreator(): IModifyCreator;

	/** Gets the accessor for removing records. */
	getDeleter(): IModifyDeleter;

	/** Gets the accessor for adding to a record without overwriting what is there. */
	getExtender(): IModifyExtender;

	/** Gets the accessor for changing existing records. */
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
