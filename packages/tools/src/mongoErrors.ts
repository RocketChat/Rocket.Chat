import { isObject } from './isObject';

export const MongoErrorCode = {
	NamespaceNotFound: 26,
	IndexNotFound: 27,
	CursorNotFound: 43,
	DuplicateKey: 11000,
} as const;

// Matches by code rather than `instanceof`: the driver that raises the error is not the copy of `mongodb` callers can import.
export const hasMongoErrorCode = (error: unknown, code: number): boolean => isObject(error) && 'code' in error && error.code === code;

// A bulk write carries the code of its first write error only, so it counts as a duplicate when every write error is one.
export const isDuplicateKeyError = (error: unknown): boolean => {
	if (!isObject(error)) {
		return false;
	}

	if ('writeErrors' in error && Array.isArray(error.writeErrors) && error.writeErrors.length) {
		return error.writeErrors.every((writeError) => hasMongoErrorCode(writeError, MongoErrorCode.DuplicateKey));
	}

	return hasMongoErrorCode(error, MongoErrorCode.DuplicateKey);
};
