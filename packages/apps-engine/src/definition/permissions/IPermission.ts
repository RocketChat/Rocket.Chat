/**
 * One capability an App asks for in its manifest.
 *
 * The workspace shows the list at install time and the engine denies any call
 * the App did not ask for. Pick the values from `AppPermissions` rather than
 * writing names by hand.
 */
export interface IPermission {
	/** The permission's name, in the form `scope.action`. */
	name: string;
	/** Whether the App refuses to run without this permission. */
	required?: boolean;
}

/** Permission to make outbound HTTP requests. */
export interface INetworkingPermission extends IPermission {
	/** The hosts the App may reach. An empty array allows any host. */
	domains: Array<string>;
}

/** Permission to obtain a Rocket.Chat Cloud token for the workspace. */
export interface IWorkspaceTokenPermission extends IPermission {
	/** The cloud scopes the issued token may carry. */
	scopes: Array<string>;
}

/** Permission to read the workspace's own server settings. */
export interface IReadSettingPermission extends IPermission {
	/** The ids of settings the App may read even though the workspace hides them. */
	hiddenSettings: Array<string>;
}
