import { Serialized } from '@rocket.chat/core-typings';

export declare const APIClient: {
	delete<P, R = any>(endpoint: string, params?: Serialized<P>): Promise<Serialized<R>>;
	get<P, R = any>(endpoint: string, params?: void extends P ? void : Serialized<P>): Promise<Serialized<R>>;
	post<P, B, R = any>(endpoint: string, params?: Serialized<P>, body?: B): Promise<Serialized<R>>;
	upload<P, B, R = any>(
		endpoint: string,
		params?: Serialized<P>,
		formData?: B,
		xhrOptions?: {
			progress: (amount: number) => void;
			error: (ev: ProgressEvent<XMLHttpRequestEventTarget>) => void;
		},
	): { promise: Promise<Serialized<R>> };
	getCredentials(): {
		'X-User-Id': string;
		'X-Auth-Token': string;
	};
	_jqueryCall(method?: string, endpoint?: string, params?: any, body?: any, headers?: Record<string, string>, dataType?: string): any;
	v1: {
		delete<P, R = any>(endpoint: string, params?: Serialized<P>): Promise<Serialized<R>>;
		get<P, R = any>(endpoint: string, params?: Serialized<P>): Promise<Serialized<R>>;
		post<P, B, R = any>(endpoint: string, params?: Serialized<P>, body?: B): Promise<Serialized<R>>;
		put<P, B, R = any>(endpoint: string, params?: Serialized<P>, body?: B): Promise<Serialized<R>>;
		upload<P, B, R = any>(
			endpoint: string,
			params?: Serialized<P>,
			formData?: B,
			xhrOptions?: {
				progress: (amount: number) => void;
				error: (ev: ProgressEvent<XMLHttpRequestEventTarget>) => void;
			},
		): { promise: Promise<Serialized<R>> };
	};
};
