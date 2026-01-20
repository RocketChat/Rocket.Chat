import type { LicenseModule } from '@rocket.chat/core-typings';
import type { ValidateFunction } from 'ajv';
import type { Request } from 'express';
import type * as z from 'zod';

type Range<N extends number, Result extends number[] = []> = Result['length'] extends N
	? Result[number]
	: Range<N, [...Result, Result['length']]>;

export type SuccessStatusCodes = Exclude<Range<208>, Range<200>>;

export type RedirectStatusCodes = Exclude<Range<308>, Range<300>>;

export type AuthorizationStatusCodes = Exclude<Range<451>, Range<400>>;

export type ErrorStatusCodes = Exclude<Exclude<Range<511>, Range<500>>, 509>;

type HTTPStatusCodes = SuccessStatusCodes | RedirectStatusCodes | AuthorizationStatusCodes | ErrorStatusCodes;

export type ResponseSchema<T extends TypedOptions> = {
	[K in keyof T['response']]: {
		statusCode: K extends number ? number : never;
		body: T['response'][K] extends z.ZodType ? z.infer<T['response'][K]> : T['response'][K] extends ValidateFunction<infer U> ? U : unknown;
		headers?: Record<string, string>;
	};
}[keyof T['response']];

export type TypedRequest = Request & {
	response: {
		setHeader: (name: string, value: string) => void;
	};
	routePath: string;
	queryParams: Record<string, any>;
	bodyParams: Record<string, any>;
	urlParams: Record<string, any>;
	requestIp: string;
	path: string;
};

export type TypedResponse = {
	statusCode?: number;
	body: any;
	headers?: Record<string, string>;
};

export type TypedOptions = {
	response: Partial<Record<HTTPStatusCodes, z.ZodType | ValidateFunction>>;
	query?: z.ZodType | ValidateFunction;
	body?: z.ZodType | ValidateFunction;
	tags?: string[];
	typed?: boolean;
	license?: LicenseModule[];
	authRequired?: boolean;
};
