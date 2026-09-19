import type { IEnvironmentRead, IHttp, IRead } from '.';
import type { IApiEndpointMetadata } from '../api';
import type { IEnvironmentWrite } from './IEnvironmentWrite';

/**
 * The accessors an App holds for its whole life, reachable from
 * `App.getAccessors`.
 *
 * Handlers are handed their own accessors as arguments; use these where no
 * handler is running, in a slash command or an API endpoint for instance.
 */
export interface IAppAccessors {
	/** Reads the workspace's settings and the App's own environment. */
	readonly environmentReader: IEnvironmentRead;
	/** Writes the App's own settings. */
	readonly environmentWriter: IEnvironmentWrite;
	/** Reads rooms, users, messages and everything else the App may see. */
	readonly reader: IRead;
	/** Calls out to the world beyond the workspace. */
	readonly http: IHttp;
	/** The endpoints this App registered, with the paths they ended up at. */
	readonly providedApiEndpoints: Array<IApiEndpointMetadata>;
}
