import type { PaginatedResult } from '@rocket.chat/rest-typings';
import type { ValidateFunction } from 'ajv';

import type { APIClass, ExtractRoutesFromAPI } from './ApiClass';

type Expect<T extends true> = T;
type ShallowEqual<X, Y> = X extends Y ? (Y extends X ? true : false) : false;

describe('ExtractRoutesFromAPI type utility', () => {
	it('Should return the expected type for GET', () => {
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

	it('Should return the expected type for POST', () => {
		type API = APIClass<
			'/v1',
			{
				method: 'POST';
				path: '/v1/endpoint.test';
				response: {
					200: ValidateFunction<
						PaginatedResult<{
							sounds: string[];
						}>
					>;
				};
				body: ValidateFunction<{
					query: string;
				}>;
				authRequired: true;
			}
		>;
		type test = Expect<
			ShallowEqual<
				ReturnType<ExtractRoutesFromAPI<API>['/v1/endpoint.test']['POST']>,
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
});
