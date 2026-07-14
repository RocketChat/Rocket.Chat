import { validHeaders, invalidHeaders, unsupportedHeaders } from './test-data';
import { parseDigestHeader } from '../src/auth/parseDigestHeader';

describe('parseDigestHeader', () => {
	it.each([...validHeaders, ...unsupportedHeaders])('should parse [$raw]', ({ raw, parsed }) => {
		expect(parseDigestHeader(raw)).toStrictEqual(parsed);
	});

	it.each(invalidHeaders)('should fail to parse [$raw]', ({ raw }) => {
		expect(() => parseDigestHeader(raw)).toThrow();
	});
});
