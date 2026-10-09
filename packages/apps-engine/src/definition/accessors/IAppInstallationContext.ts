import type { IUser } from '../users';

/** Who installed the App, handed to `App.onInstall`. */
export interface IAppInstallationContext {
	/** The administrator who installed the App. */
	user: IUser;
}
