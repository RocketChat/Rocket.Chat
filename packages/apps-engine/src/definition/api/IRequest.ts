import type { RequestMethod } from '../accessors';
import type { IUser } from '../users';

/** An inbound call to one of an App's `IApiEndpoint` handlers. */
export interface IApiRequest {
	/** The HTTP method the caller used. */
	method: RequestMethod;
	/** The request's headers, with lower-cased names. */
	headers: { [key: string]: string };
	/** The query string, parsed. */
	query: { [key: string]: string };
	/** The path segments the endpoint's path declared as parameters. */
	params: { [key: string]: string };
	/** The request's body, already parsed when its content type allowed it. */
	content: any;
	/** The random segment in the URL of an `ApiVisibility.PRIVATE` endpoint. */
	privateHash?: string;
	/**
	 * The user that is making the request, as
	 * authenticated by Rocket.Chat's strategy.
	 */
	user?: IUser;
}
