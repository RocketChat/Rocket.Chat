import type { IApiExample } from './IApiExample';

/**
 * A registered endpoint as the workspace lists it, so an administrator can see
 * what an App exposes and where.
 */
export interface IApiEndpointMetadata {
	/** The path the App declared. */
	path: string;
	/** The path the endpoint ended up at, with visibility and App id applied. */
	computedPath: string;
	/** The HTTP methods the endpoint handles. */
	methods: Array<string>;
	/** The examples the App declared, keyed by the method they illustrate. */
	examples?: {
		[key: string]: IApiExample;
	};
}
