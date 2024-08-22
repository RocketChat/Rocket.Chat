import 'meteor/http';

declare module 'meteor/http' {
	namespace HTTP {
		interface HTTPRequest {
			content?: string | undefined;
			data?: any;
			query?: string | undefined;
			params?: { [id: string]: string } | undefined;
			auth?: string | undefined;
			headers?: { [id: string]: string } | undefined;
			timeout?: number | undefined;
			followRedirects?: boolean | undefined;
		}

		interface HTTPResponse {
			statusCode?: number | undefined;
			headers?: { [id: string]: string } | undefined;
			content?: string | undefined;
			data?: any;
		}

		type AsyncCallback = (error: Meteor.Error | null, result?: HTTPResponse) => void;

		function del(url: string, callOptions?: HTTP.HTTPRequest, asyncCallback?: AsyncCallback): HTTP.HTTPResponse;

		function get(url: string, callOptions?: HTTP.HTTPRequest, asyncCallback?: AsyncCallback): HTTP.HTTPResponse;

		function post(url: string, callOptions?: HTTP.HTTPRequest, asyncCallback?: AsyncCallback): HTTP.HTTPResponse;

		function put(url: string, callOptions?: HTTP.HTTPRequest, asyncCallback?: AsyncCallback): HTTP.HTTPResponse;

		function call(method: string, url: string, options?: HTTP.HTTPRequest, asyncCallback?: AsyncCallback): HTTP.HTTPResponse;

		function call(
			method: string,
			url: string,
			options?: {
				content?: string;
				data?: object;
				query?: string;
				params?: object;
				auth?: string;
				headers?: object;
				timeout?: number;
				followRedirects?: boolean;
				npmRequestOptions?: object;
				beforeSend?: (xhr: XMLHttpRequest) => void;
			},
			asyncCallback?: AsyncCallback,
		): HTTP.HTTPResponse;
	}
}
