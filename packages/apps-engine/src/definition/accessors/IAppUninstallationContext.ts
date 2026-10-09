import type { IUser } from '../users';

/** Who removed the App, handed to `App.onUninstall`. */
export interface IAppUninstallationContext {
	/** The administrator who removed the App. */
	user: IUser;
}
