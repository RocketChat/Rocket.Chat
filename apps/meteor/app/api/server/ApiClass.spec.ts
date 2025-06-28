import type { PaginatedResult } from '@rocket.chat/rest-typings';
import type { ValidateFunction } from 'ajv';

import type { APIClass, ExtractRoutesFromAPI } from './ApiClass';

type Expect<T extends true> = T;
type ShallowEqual<X, Y> = X extends Y ? (Y extends X ? true : false) : false;

type API = APIClass<
	'/v1',
	{
		method: 'GET';
		path: '/v1/endpoint.test';
		response: {
			200: ValidateFunction<
				PaginatedResult<{
					sounds: string[];
				}>
			>;
		};
		query: ValidateFunction<{
			query: string;
		}>;
		authRequired: true;
	}
>;

it('Should return the expected type', () => {
	type test = Expect<
		ShallowEqual<
			ReturnType<ExtractRoutesFromAPI<API>['/v1/endpoint.test']['GET']>,
			{
				count: number;
				offset: number;
				total: number;
				sounds: string[];
			}
		>
	>;
	true as test;
});

describe('ExtractRoutesFromAPI GET when query is (never, unknown, any, e.g.)', () => {
	it('Should extract correct function signature when query is not present', () => {
		type APIWithNeverQuery = APIClass<
			'/v1',
			{
				method: 'GET';
				path: '/v1/endpoint.test';
				response: {
					200: ValidateFunction<unknown>;
				};
				authRequired: true;
			}
		>;
		type ExpectedFunctionSignature = Expect<
			ShallowEqual<ExtractRoutesFromAPI<APIWithNeverQuery>['/v1/endpoint.test']['GET'], (params: unknown) => unknown>
		>;
		true as ExpectedFunctionSignature;
	});

	it('Should extract correct function signature when query is never', () => {
		type APIWithNeverQuery = APIClass<
			'/v1',
			{
				method: 'GET';
				path: '/v1/endpoint.test';
				response: {
					200: ValidateFunction<unknown>;
				};
				query: ValidateFunction<never>;
				authRequired: true;
			}
		>;
		type ExpectedFunctionSignature = Expect<
			ShallowEqual<ExtractRoutesFromAPI<APIWithNeverQuery>['/v1/endpoint.test']['GET'], (params: never) => unknown>
		>;
		true as ExpectedFunctionSignature;
	});

	it('Should extract correct function signature when query is undefined', () => {
		type APIWithUndefinedQuery = APIClass<
			'/v1',
			{
				method: 'GET';
				path: '/v1/endpoint.test';
				response: {
					200: ValidateFunction<unknown>;
				};
				query: ValidateFunction<undefined>;
				authRequired: true;
			}
		>;
		type ExpectedFunctionSignature = Expect<
			ShallowEqual<ExtractRoutesFromAPI<APIWithUndefinedQuery>['/v1/endpoint.test']['GET'], (params: undefined) => unknown>
		>;
		true as ExpectedFunctionSignature;
	});

	it('Should extract correct function signature when query is any', () => {
		type APIWithAnyQuery = APIClass<
			'/v1',
			{
				method: 'GET';
				path: '/v1/endpoint.test';
				response: {
					200: ValidateFunction<unknown>;
				};
				query: ValidateFunction<any>;
				authRequired: true;
			}
		>;
		type ExpectedFunctionSignature = Expect<
			ShallowEqual<ExtractRoutesFromAPI<APIWithAnyQuery>['/v1/endpoint.test']['GET'], (params: unknown) => unknown>
		>;
		true as ExpectedFunctionSignature;
	});

	it('Should extract correct function signature when query is unknown', () => {
		type APIWithUnknownQuery = APIClass<
			'/v1',
			{
				method: 'GET';
				path: '/v1/endpoint.test';
				response: {
					200: ValidateFunction<unknown>;
				};
				query: ValidateFunction<unknown>;
				authRequired: true;
			}
		>;
		type ExpectedFunctionSignature = Expect<
			ShallowEqual<ExtractRoutesFromAPI<APIWithUnknownQuery>['/v1/endpoint.test']['GET'], (params: unknown) => unknown>
		>;
		true as ExpectedFunctionSignature;
	});

	it('Should extract correct function signature when query is null', () => {
		type APIWithNullQuery = APIClass<
			'/v1',
			{
				method: 'GET';
				path: '/v1/endpoint.test';
				response: {
					200: ValidateFunction<unknown>;
				};
				query: ValidateFunction<null>;
				authRequired: true;
			}
		>;
		type ExpectedFunctionSignature = Expect<
			ShallowEqual<ExtractRoutesFromAPI<APIWithNullQuery>['/v1/endpoint.test']['GET'], (params: null) => unknown>
		>;
		true as ExpectedFunctionSignature;
	});
});

describe('ExtractRoutesFromAPI POST when body is (never, unknown, any, e.g.)', () => {
	it('Should extract correct function signature when body is not present', () => {
		type APIWithNeverBody = APIClass<
			'/v1',
			{
				method: 'POST';
				path: '/v1/endpoint.test';
				response: {
					200: ValidateFunction<unknown>;
					201: ValidateFunction<unknown>;
				};
				authRequired: true;
			}
		>;
		type ExpectedFunctionSignature = Expect<
			ShallowEqual<ExtractRoutesFromAPI<APIWithNeverBody>['/v1/endpoint.test']['POST'], (params: unknown) => unknown>
		>;
		true as ExpectedFunctionSignature;
	});

	it('Should extract correct function signature when body is never', () => {
		type APIWithNeverBody = APIClass<
			'/v1',
			{
				method: 'POST';
				path: '/v1/endpoint.test';
				response: {
					200: ValidateFunction<unknown>;
					201: ValidateFunction<unknown>;
				};
				body: ValidateFunction<never>;
				authRequired: true;
			}
		>;
		type ExpectedFunctionSignature = Expect<
			ShallowEqual<ExtractRoutesFromAPI<APIWithNeverBody>['/v1/endpoint.test']['POST'], (params: never) => unknown>
		>;
		true as ExpectedFunctionSignature;
	});

	it('Should extract correct function signature when body is undefined', () => {
		type APIWithUndefinedBody = APIClass<
			'/v1',
			{
				method: 'POST';
				path: '/v1/endpoint.test';
				response: {
					200: ValidateFunction<unknown>;
					201: ValidateFunction<unknown>;
				};
				body: ValidateFunction<undefined>;
				authRequired: true;
			}
		>;
		type ExpectedFunctionSignature = Expect<
			ShallowEqual<ExtractRoutesFromAPI<APIWithUndefinedBody>['/v1/endpoint.test']['POST'], (params: undefined) => unknown>
		>;
		true as ExpectedFunctionSignature;
	});

	it('Should extract correct function signature when body is any', () => {
		type APIWithAnyBody = APIClass<
			'/v1',
			{
				method: 'POST';
				path: '/v1/endpoint.test';
				response: {
					200: ValidateFunction<unknown>;
					201: ValidateFunction<unknown>;
				};
				body: ValidateFunction<any>;
				authRequired: true;
			}
		>;
		type ExpectedFunctionSignature = Expect<
			ShallowEqual<ExtractRoutesFromAPI<APIWithAnyBody>['/v1/endpoint.test']['POST'], (params: unknown) => unknown>
		>;
		true as ExpectedFunctionSignature;
	});

	it('Should extract correct function signature when body is unknown', () => {
		type APIWithUnknownBody = APIClass<
			'/v1',
			{
				method: 'POST';
				path: '/v1/endpoint.test';
				response: {
					200: ValidateFunction<unknown>;
					201: ValidateFunction<unknown>;
				};
				body: ValidateFunction<unknown>;
				authRequired: true;
			}
		>;
		type ExpectedFunctionSignature = Expect<
			ShallowEqual<ExtractRoutesFromAPI<APIWithUnknownBody>['/v1/endpoint.test']['POST'], (params: unknown) => unknown>
		>;
		true as ExpectedFunctionSignature;
	});

	it('Should extract correct function signature when body is null', () => {
		type APIWithNullBody = APIClass<
			'/v1',
			{
				method: 'POST';
				path: '/v1/endpoint.test';
				response: {
					200: ValidateFunction<unknown>;
					201: ValidateFunction<unknown>;
				};
				body: ValidateFunction<null>;
				authRequired: true;
			}
		>;
		type ExpectedFunctionSignature = Expect<
			ShallowEqual<ExtractRoutesFromAPI<APIWithNullBody>['/v1/endpoint.test']['POST'], (params: null) => unknown>
		>;
		true as ExpectedFunctionSignature;
	});
});
