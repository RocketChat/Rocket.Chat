import type { AppInterface } from './AppInterface';
import type { IAppAuthorInfo } from './IAppAuthorInfo';
import type { IPermission } from '../permissions/IPermission';

/**
 * The App's manifest, as declared in its `app.json`.
 *
 * The host reads this before it loads any of the App's code, so everything here
 * describes the App rather than its runtime state.
 */
export interface IAppInfo {
	/** The App's unique identifier, a UUID the author generates once and never changes. */
	id: string;
	/** The App's display name. */
	name: string;
	/** The display name slugged, used wherever an identifier has to be readable. */
	nameSlug: string;
	/** The App's own version, following [semver](https://semver.org). */
	version: string;
	/** What the App does, shown to users and administrators. */
	description: string;
	/**
	 * The Apps-Engine version the App is written against, following
	 * [semver](https://semver.org). A workspace refuses to install an App whose
	 * required version it cannot satisfy.
	 */
	requiredApiVersion: string;
	/** Who to credit and who to contact about the App. */
	author: IAppAuthorInfo;
	/** Path, relative to the package root, of the file exporting the `App` subclass. */
	classFile: string;
	/** Path, relative to the package root, of the App's icon. */
	iconFile: string;
	/** The event handler interfaces the App implements. */
	implements: Array<AppInterface>;
	/** Base64 string of the App's icon. */
	iconFileContent?: string;
	/**
	 * The handlers the App declares essential.
	 *
	 * When the App is disabled, the host aborts any action that would have
	 * called one of these rather than carrying on without the App.
	 */
	essentials?: Array<AppInterface>;
	/**
	 * What the App is allowed to reach.
	 *
	 * An App that declares no permissions gets `defaultPermissions`.
	 */
	permissions?: Array<IPermission>;
	/** The premium add-on this App requires, if any. */
	addon?: string;
}
