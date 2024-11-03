import type { IPersistence } from './IPersistence';
import type { IRead } from './IRead';

/**
 * The Http package allows users to call out to an external web service.
 * Based off of: https://github.com/meteor-typings/meteor/blob/master/1.4/main.d.ts#L869
 */
export interface IHttp {
    get(url: string, options?: IHttpRequest): Promise<IHttpResponse>;

    post(url: string, options?: IHttpRequest): Promise<IHttpResponse>;

    put(url: string, options?: IHttpRequest): Promise<IHttpResponse>;

    del(url: string, options?: IHttpRequest): Promise<IHttpResponse>;

    patch(url: string, options?: IHttpRequest): Promise<IHttpResponse>;
}

export enum RequestMethod {
    GET = 'get',
    POST = 'post',
    PUT = 'put',
    DELETE = 'delete',
    HEAD = 'head',
    OPTIONS = 'options',
    PATCH = 'patch',
}

export interface IHttpRequest {
    content?: string;
    data?: any;
    query?: string;
    params?: {
        [key: string]: string;
    };
    auth?: string;
    headers?: {
        [key: string]: string;
    };
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
}

export interface IHttpResponse {
    url: string;
    method: RequestMethod;
    statusCode: number;
    headers?: {
        [key: string]: string;
    };
    content?: string;
    data?: any;
}

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

export interface IHttpPreRequestHandler {
    executePreHttpRequest(url: string, request: IHttpRequest, read: IRead, persistence: IPersistence): Promise<IHttpRequest>;
}

export interface IHttpPreResponseHandler {
    executePreHttpResponse(response: IHttpResponse, read: IRead, persistence: IPersistence): Promise<IHttpResponse>;
}

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
