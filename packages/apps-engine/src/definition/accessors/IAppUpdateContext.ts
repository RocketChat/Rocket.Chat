import type { IUser } from '../users';

/**
 * What the App is updating from, handed to `App.onUpdate`.
 *
 * Compare {@link IAppUpdateContext.oldAppVersion} against the App's own
 * version to decide which migrations still have to run.
 */
export interface IAppUpdateContext {
	/** The administrator who updated the App, when a person did. */
	user?: IUser;
	/** The version the App is being updated from. */
	oldAppVersion: string;
}
