import { FilterQuery, ObjectQuerySelector, SortOptionObject } from 'mongodb';

import { IUser } from '../../../definition/IUser';

type Route<Authenticated extends boolean = false> = {
	urlParams: any;
	queryParams: any;
	bodyParams: any;
	getPaginationItems(): {
		offset: number;
		count: number;
	};
	parseJsonQuery(): {
		sort: SortOptionObject<any>;
		fields: ObjectQuerySelector<any>;
		query: FilterQuery<any>;
	};
} & (Authenticated extends true ? {
	user: IUser;
	userId: IUser['_id'];
} : {});

export declare class APIClass {
	public addRoute<Authenticated extends boolean = false>(path: string, options: { authRequired?: Authenticated }, methods: {
		get?: (this: Route<Authenticated>) => unknown;
		post?: (this: Route<Authenticated>) => unknown;
		delete?: (this: Route<Authenticated>) => unknown;
	}): void;

	public success<T>(result?: T): {
		statusCode: 200;
		body: T extends Record<string, unknown> ? (T & { success: true }) : T;
	};

	public failure<T>(result?: T, errorType?: unknown, stack?: unknown, error?: unknown): {
		statusCode: 400;
		body: T extends Record<string, unknown> ? (T & { success: false }) : {
			success: false;
			error: T;
			stack: unknown;
			errorType?: unknown;
			details?: unknown;
		};
	};

	public unauthorized<T extends string = 'unauthorized'>(msg?: T): {
		statusCode: 403;
		body: {
			success: false;
			error: T;
		};
	};
}

export declare const API: {
	v1: APIClass;
	default: APIClass;
};

export declare const defaultRateLimiterOptions: {
	numRequestsAllowed: number;
	intervalTimeInMS: number;
};
