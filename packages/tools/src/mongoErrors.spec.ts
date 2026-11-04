import { MongoErrorCode, hasMongoErrorCode, isDuplicateKeyError } from './mongoErrors';

const mongoError = (code: unknown, extra: Record<string, unknown> = {}) => Object.assign(new Error('mongo error'), { code, ...extra });

describe('hasMongoErrorCode', () => {
	test.each([
		['matching code', mongoError(MongoErrorCode.IndexNotFound), true],
		['plain object with matching code', { code: MongoErrorCode.IndexNotFound }, true],
		['different code', mongoError(MongoErrorCode.NamespaceNotFound), false],
		['same code as a string', mongoError(String(MongoErrorCode.IndexNotFound)), false],
		['error without code', new Error('index not found'), false],
		['null', null, false],
		['undefined', undefined, false],
		['number', MongoErrorCode.IndexNotFound, false],
	])('%s', (_case, error, expected) => {
		expect(hasMongoErrorCode(error, MongoErrorCode.IndexNotFound)).toBe(expected);
	});
});

describe('isDuplicateKeyError', () => {
	test.each([
		['single write', mongoError(MongoErrorCode.DuplicateKey), true],
		['single write with another code', mongoError(MongoErrorCode.CursorNotFound), false],
		[
			'bulk write where every write error is a duplicate',
			mongoError(MongoErrorCode.DuplicateKey, {
				writeErrors: [{ code: MongoErrorCode.DuplicateKey }, { code: MongoErrorCode.DuplicateKey }],
			}),
			true,
		],
		[
			'bulk write where only the first write error is a duplicate',
			mongoError(MongoErrorCode.DuplicateKey, { writeErrors: [{ code: MongoErrorCode.DuplicateKey }, { code: 121 }] }),
			false,
		],
		['bulk write with no write errors', mongoError(MongoErrorCode.DuplicateKey, { writeErrors: [] }), true],
		['message mentioning E11000 without a code', new Error('E11000 duplicate key error collection'), false],
		['null', null, false],
	])('%s', (_case, error, expected) => {
		expect(isDuplicateKeyError(error)).toBe(expected);
	});
});
