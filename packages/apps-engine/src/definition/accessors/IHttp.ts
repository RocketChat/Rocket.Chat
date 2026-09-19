import type { IPersistence } from './IPersistence';
import type { IRead } from './IRead';

/**
 * The Http package allows users to call out to an external web service.
 * Based off of: https://github.com/meteor-typings/meteor/blob/master/1.4/main.d.ts#L869
 */
export interface IHttp {
	/** Sends a GET request. */
	get(url: string, options?: IHttpRequest): Promise<IHttpResponse>;

	/** Sends a POST request. */
	post(url: string, options?: IHttpRequest): Promise<IHttpResponse>;

	/** Sends a PUT request. */
	put(url: string, options?: IHttpRequest): Promise<IHttpResponse>;

	/** Sends a DELETE request. */
	del(url: string, options?: IHttpRequest): Promise<IHttpResponse>;

	/** Sends a PATCH request. */
	patch(url: string, options?: IHttpRequest): Promise<IHttpResponse>;
}

/** An HTTP method. */
export enum RequestMethod {
	GET = 'get',
	POST = 'post',
	PUT = 'put',
	DELETE = 'delete',
	HEAD = 'head',
	OPTIONS = 'options',
	PATCH = 'patch',
}

/**
 * How to make one outbound request.
 *
 * The App's `IHttpExtend` defaults are merged in, so anything set here is
 * per-request. Sending a request needs the `networking` permission, and only
 * the domains that permission lists can be reached.
 */
export interface IHttpRequest {
	/** The request's body, as a string. */
	content?: string;
	/** The request's body as an object. Used only when `content` is not set. */
	data?: any;
	/** A raw query string to append to the URL. */
	query?: string;
	/**
	 * Values to send as name and value pairs.
	 *
	 * They go into the URL's query string when the request already has a body,
	 * or when the method is GET or HEAD. Otherwise they become a form-encoded
	 * body. Write them into the URL yourself when it has to be the query string
	 * either way.
	 */
	params?: {
		[key: string]: string;
	};
	/** Credentials for basic authentication, as `username:password`. */
	auth?: string;
	/** The request's headers. */
	headers?: {
		[key: string]: string;
	};
	/** How long to wait, in milliseconds, before giving up on the request. */
	timeout?: number;
	/**
	 * The encoding to be used on response data.
	 *
	 * If null, the body is returned as a Buffer. Anything else (including the default value of undefined)
	 * will be passed as the encoding parameter to toString() (meaning this is effectively 'utf8' by default).
	 * (Note: if you expect binary data, you should set encoding: null.)
	 */
	encoding?: string | null;
	/**
	 * if `true`, requires SSL certificates be valid.
	 *
	 * Defaul: `true`;
	 */
	strictSSL?: boolean;
	/**
	 * If `true`, the server certificate is verified against the list of supplied CAs.
	 *
	 * Default: `true`.
	 *
	 * https://nodejs.org/api/tls.html#tls_tls_connect_options_callback
	 */
	rejectUnauthorized?: boolean;
	/**
	 * If `true`, enables SSRF (Server-Side Request Forgery) validation for the HTTP request.
	 * The request URL will be checked against internal IP addresses and private networks.
	 *
	 * Default: `false`
	 *
	 * As SSRF validation can potentially break legitimate requests to internal resources, it is not enabled by default.
	 */
	ssrfValidation?: boolean;
}

/**
 * What came back from an outbound request.
 *
 * A response arrives whatever its status: check
 * {@link IHttpResponse.statusCode} rather than expecting a rejection.
 */
export interface IHttpResponse {
	/** The URL the request went to. */
	url: string;
	/** The method the request used. */
	method: RequestMethod;
	/** The status the server answered with. */
	statusCode: number;
	/** The response's headers. */
	headers?: {
		[key: string]: string;
	};
	/** The response's body, decoded with `IHttpRequest.encoding`. */
	content?: string;
	/** The response's body parsed as JSON, when the server said it was JSON. */
	data?: any;
}

/**
 * The defaults and hooks applied to every request the App makes.
 *
 * Set these up once from `IConfigurationExtend.http`; anything an individual
 * `IHttpRequest` sets is merged on top.
 */
export interface IHttpExtend {
	/**
	 * A method for providing a single header which is added to every request.
	 *
	 * @param key the name of the header
	 * @param value the header's content
	 */
	provideDefaultHeader(key: string, value: string): void;

	/**
	 * A method for providing more than one header which are added to every request.
	 *
	 * @param headers an object with strings as the keys (header name) and strings as values (header content)
	 */
	provideDefaultHeaders(headers: { [key: string]: string }): void;

	/**
	 * A method for providing a single query parameter which is added to every request.
	 *
	 * @param key the name of the query parameter
	 * @param value the query parameter's content
	 */
	provideDefaultParam(key: string, value: string): void;

	/**
	 * A method for providing more than one query parameters which are added to every request.
	 *
	 * @param headers an object with strings as the keys (parameter name) and strings as values (parameter content)
	 */
	provideDefaultParams(params: { [key: string]: string }): void;

	/**
	 * Method for providing a function which is called before every request is called out to the final destination.
	 * This can be called more than once which means there can be more than one handler. The order provided is the order called.
	 * Note: if this handler throws an error when it is executed then the request will be aborted.
	 *
	 * @param handler the instance of the IHttpPreRequestHandler
	 */
	providePreRequestHandler(handler: IHttpPreRequestHandler): void;

	/**
	 * Method for providing a function which is called after every response is got from the url and before the result is returned.
	 * This can be called more than once which means there can be more than one handler. The order provided is the order called.
	 * Note: if this handler throws an error when it is executed then the respone will not be returned
	 *
	 * @param handler the instance of the IHttpPreResponseHandler
	 */
	providePreResponseHandler(handler: IHttpPreResponseHandler): void;

	/**
	 * A method for getting all of the default headers provided, the value is a readonly and any modifications done will be ignored.
	 * Please use the provider methods for adding them.
	 */
	getDefaultHeaders(): Map<string, string>;

	/**
	 * A method for getting all of the default parameters provided, the value is a readonly and any modifications done will be ignored.
	 * Please use the provider methods for adding them.
	 */
	getDefaultParams(): Map<string, string>;

	/**
	 * A method for getting all of the pre-request handlers provided, the value is a readonly and any modifications done will be ignored.
	 * Please use the provider methods for adding them.
	 */
	getPreRequestHandlers(): Array<IHttpPreRequestHandler>;

	/**
	 * A method for getting all of the pre-response handlers provided, the value is a readonly and any modifications done will be ignored.
	 * Please use the provider methods for adding them.
	 */
	getPreResponseHandlers(): Array<IHttpPreResponseHandler>;
}

/** Rewrites a request on its way out, a token refresh for instance. */
export interface IHttpPreRequestHandler {
	/**
	 * Returns the request to send in place of this one.
	 *
	 * Throw to abort the request.
	 */
	executePreHttpRequest(url: string, request: IHttpRequest, read: IRead, persistence: IPersistence): Promise<IHttpRequest>;
}

/** Rewrites a response before the caller sees it. */
export interface IHttpPreResponseHandler {
	/**
	 * Returns the response to hand back in place of this one.
	 *
	 * Throw to keep the caller from receiving a response at all.
	 */
	executePreHttpResponse(response: IHttpResponse, read: IRead, persistence: IPersistence): Promise<IHttpResponse>;
}

/** The HTTP status codes {@link IHttpResponse.statusCode} and `IApiResponse.status` use. */
export enum HttpStatusCode {
	CONTINUE = 100,
	SWITCHING_PROTOCOLS = 101,
	OK = 200,
	CREATED = 201,
	ACCEPTED = 202,
	NON_AUTHORITATIVE_INFORMATION = 203,
	NO_CONTENT = 204,
	RESET_CONTENT = 205,
	PARTIAL_CONTENT = 206,
	MULTIPLE_CHOICES = 300,
	MOVED_PERMANENTLY = 301,
	FOUND = 302,
	SEE_OTHER = 303,
	NOT_MODIFIED = 304,
	USE_PROXY = 305,
	TEMPORARY_REDIRECT = 307,
	BAD_REQUEST = 400,
	UNAUTHORIZED = 401,
	PAYMENT_REQUIRED = 402,
	FORBIDDEN = 403,
	NOT_FOUND = 404,
	METHOD_NOT_ALLOWED = 405,
	NOT_ACCEPTABLE = 406,
	PROXY_AUTHENTICATION_REQUIRED = 407,
	REQUEST_TIMEOUT = 408,
	CONFLICT = 409,
	GONE = 410,
	LENGTH_REQUIRED = 411,
	PRECONDITION_FAILED = 412,
	REQUEST_ENTITY_TOO_LARGE = 413,
	REQUEST_URI_TOO_LONG = 414,
	UNSUPPORTED_MEDIA_TYPE = 415,
	REQUESTED_RANGE_NOT_SATISFIABLE = 416,
	EXPECTATION_FAILED = 417,
	UNPROCESSABLE_ENTITY = 422,
	TOO_MANY_REQUESTS = 429,
	INTERNAL_SERVER_ERROR = 500,
	NOT_IMPLEMENTED = 501,
	BAD_GATEWAY = 502,
	SERVICE_UNAVAILABLE = 503,
	GATEWAY_TIMEOUT = 504,
	HTTP_VERSION_NOT_SUPPORTED = 505,
}
