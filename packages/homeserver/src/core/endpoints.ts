export interface Endpoints {}

export interface EndpointDefinition {
	auth: boolean;
	rateLimit: boolean;
	query: any;
	response: any;
}

export interface Endpoint {
	GET?: EndpointDefinition;
	POST?: EndpointDefinition;
	PUT?: EndpointDefinition;
	DELETE?: EndpointDefinition;
}

export type Method =
	| 'GET'
	| 'POST'
	| 'DELETE'
	| 'PUT'
	| 'OPTIONS'
	| 'HEAD'
	| 'PATCH';

export type EndpointsPath = keyof Endpoints;

// gets the endpoints for a given Method, if is never does not exist
export type EndpointsByMethod = {
	[TMethod in Method]: {
		[TPathPattern in keyof Endpoints]: TMethod extends keyof Endpoints[TPathPattern]
			? Endpoints[TPathPattern][TMethod] extends infer TConfig
				? TConfig extends EndpointDefinition
					? TPathPattern
					: never
				: never
			: never;
	}[keyof Endpoints];
};

export type GetPropertyPath<
	TMethod extends Method,
	TPath extends EndpointsByMethod[TMethod],
	TProp extends keyof EndpointDefinition,
> = TMethod extends keyof Endpoints[TPath]
	? TProp extends keyof Endpoints[TPath][TMethod]
		? Endpoints[TPath][TMethod][TProp]
		: never
	: never;

export type ParametersByMethod<
	TMethod extends Method,
	TPath extends EndpointsByMethod[TMethod],
> = GetPropertyPath<TMethod, TPath, 'query'>;

export type ResponseByMethod<
	TMethod extends Method,
	TPath extends EndpointsByMethod[TMethod],
> = GetPropertyPath<TMethod, TPath, 'response'>;

export type FilterEndpointsByVersion<V extends 'v1' | 'v2' | 'v3'> =
	EndpointsByMethod[keyof EndpointsByMethod] extends `/${infer U}/${string}`
		? U extends V
			? EndpointsByMethod[keyof EndpointsByMethod]
			: never
		: never;

type UrlParams<T extends string> = string extends T
	? Record<string, string>
	: T extends `${string}:${infer Param}/${infer Rest}`
		? { [k in Param | keyof UrlParams<Rest>]: string }
		: T extends `${string}:${infer Param}`
			? { [k in Param]: string }
			: undefined | Record<string, never>;

export type GetUrlParams<
	TMethod extends Method,
	TPath extends EndpointsByMethod[TMethod],
> = UrlParams<TPath>;
