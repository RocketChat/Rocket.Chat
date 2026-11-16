import { isCursorNotFoundMongoError, isDuplicateKeyMongoError } from './mongoErrors.js';

const MongoErrorCode = {
	CursorNotFound: 43,
	DocumentValidationFailure: 121,
	DuplicateKey: 11000,
} as const;

const mongoError = (code: unknown, extra: Record<string, unknown> = {}) => Object.assign(new Error('mongo error'), { code, ...extra });

describe('isCursorNotFoundMongoError', () => {
	test.each([
		['matching code', mongoError(MongoErrorCode.CursorNotFound), true],
		['plain object with matching code', { code: MongoErrorCode.CursorNotFound }, true],
		['different code', mongoError(MongoErrorCode.DuplicateKey), false],
		['same code as a string', mongoError(String(MongoErrorCode.CursorNotFound)), false],
		['error without code', new Error('cursor not found'), false],
		['null', null, false],
		['undefined', undefined, false],
		['number', MongoErrorCode.CursorNotFound, false],
	])('%s', (_case, error, expected) => {
		expect(isCursorNotFoundMongoError(error)).toBe(expected);
	});
});

describe('isDuplicateKeyMongoError', () => {
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
			mongoError(MongoErrorCode.DuplicateKey, {
				writeErrors: [{ code: MongoErrorCode.DuplicateKey }, { code: MongoErrorCode.DocumentValidationFailure }],
			}),
			false,
		],
		[
			'bulk write with a write error that is not an object',
			mongoError(MongoErrorCode.DuplicateKey, { writeErrors: [{ code: MongoErrorCode.DuplicateKey }, null] }),
			false,
		],
		['bulk write with no write errors', mongoError(MongoErrorCode.DuplicateKey, { writeErrors: [] }), true],
		['message mentioning E11000 without a code', new Error('E11000 duplicate key error collection'), false],
		['null', null, false],
	])('%s', (_case, error, expected) => {
		expect(isDuplicateKeyMongoError(error)).toBe(expected);
	});
});
