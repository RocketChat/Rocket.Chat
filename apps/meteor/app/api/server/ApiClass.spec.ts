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

describe('ExtractRoutesFromAPI', () => {
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
			ShallowEqual<ExtractRoutesFromAPI<APIWithNeverQuery>['/v1/endpoint.test']['GET'], () => unknown>
		>;
		true as ExpectedFunctionSignature;
	});
	it('Should extract correct function signature when body is not present', () => {
		type APIWithNeverQuery = APIClass<
			'/v1',
			{
				method: 'POST';
				path: '/v1/endpoint.test';
				response: {
					200: ValidateFunction<{
						test: string[];
					}>;
				};
				authRequired: true;
			}
		>;
		type ExpectedFunctionSignature = Expect<
			ShallowEqual<ExtractRoutesFromAPI<APIWithNeverQuery>['/v1/endpoint.test']['POST'], () => { test: string[] }>
		>;
		true satisfies ExpectedFunctionSignature;
	});
});
