import { invalidHeaders, unsupportedHeaders, validHeaders } from './test-data';
import { buildDigestResponse } from '../src/auth/buildDigestResponse';

jest.mock('node:crypto', () => ({ randomBytes: jest.fn(() => Buffer.from('0102030405060708', 'hex')) }));
jest.mock('../src/logger', () => ({
	logger: {
		log: () => null,
		warn: () => null,
		error: () => null,
	},
}));
jest.mock('../src/auth/algorithms', () => ({
	getHashAlgorithm: (algorithm: string) => {
		if (algorithm === 'SHA-1') {
			return null;
		}

		return (value: string) => {
			return `${algorithm}[${value}]`;
		};
	},
}));

const params = {
	uri: '/api/resource',
	method: 'POST',
	username: 'user',
	password: 'pass',
};

describe('buildDigestResponse', () => {
	it.each(validHeaders)('should build response for [$raw]', ({ raw: authHeader, response }) => {
		expect(buildDigestResponse({ ...params, authHeader })).toStrictEqual(response);
	});

	it.each(invalidHeaders)('should fail to build response with invalid params', ({ raw: authHeader }) => {
		expect(() => buildDigestResponse({ ...params, authHeader })).toThrow();
	});

	it.each(unsupportedHeaders)('should fail to build response with unsupported algorithms', ({ raw: authHeader }) => {
		expect(() => buildDigestResponse({ ...params, authHeader })).toThrow();
	});
});
