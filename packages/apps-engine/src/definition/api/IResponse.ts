import type { HttpStatusCode } from '../accessors';

/** What an `IApiEndpoint` handler answers a request with. */
export interface IApiResponse {
	/** The HTTP status to answer with. */
	status: HttpStatusCode;
	/** The headers to answer with. */
	headers?: { [key: string]: string };
	/** The response's body. */
	content?: any;
}

/**
 * An {@link IApiResponse} whose body is an object.
 *
 * Pass one to `ApiEndpoint.json` to have the JSON content type set for you.
 */
export interface IApiResponseJSON {
	/** The HTTP status to answer with. */
	status: HttpStatusCode;
	/** The headers to answer with. */
	headers?: { [key: string]: string };
	/** The response's body, serialized as JSON. */
	content?: { [key: string]: any };
}
