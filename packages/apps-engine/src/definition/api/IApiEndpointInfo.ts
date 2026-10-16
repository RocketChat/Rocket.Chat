/**
 * Where the endpoint being called lives, handed to the handler alongside the
 * request.
 *
 * Use it to build a URL back to the App rather than assembling one from the
 * visibility rules by hand.
 */
export interface IApiEndpointInfo {
	/** The path shared by all of the App's endpoints. */
	basePath: string;
	/** The path of this endpoint, base path included. */
	fullPath: string;
	/** The App that provides the endpoint. */
	appId: string;
	/** The random segment of an `ApiVisibility.PRIVATE` endpoint's path. */
	hash?: string;
}
