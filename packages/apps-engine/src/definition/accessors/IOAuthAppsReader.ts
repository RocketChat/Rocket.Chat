import type { IOAuthApp } from './IOAuthApp';

/**
 * Reads the OAuth clients an App registered on the workspace.
 *
 * An App can only reach the clients it registered. It needs the
 * `oauth-app.read` permission.
 */
export interface IOAuthAppsReader {
	/**
	 * Returns the OAuth app info by its id
	 * @param id - OAuth app id
	 * @param appId - the app id
	 */
	getOAuthAppById(id: string, appId: string): Promise<IOAuthApp>;
	/**
	 * Returns the OAuth app info by its name
	 * @param name - OAuth app name
	 * @param appId - the app id
	 */
	getOAuthAppByName(name: string, appId: string): Promise<Array<IOAuthApp>>;
}
