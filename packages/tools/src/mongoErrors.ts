import { isObject } from './isObject';

const MongoErrorCode = {
	CursorNotFound: 43,
	DuplicateKey: 11000,
} as const;

// Matches by code rather than `instanceof`: the driver that raises the error is not the copy of `mongodb` callers can import.
const hasCode = (error: object, code: number): boolean => 'code' in error && error.code === code;

// A bulk write carries the code of its first write error only, so it counts as a duplicate when every write error is one.
export const isDuplicateKeyError = (error: unknown): boolean => {
	if (!isObject(error)) {
		return false;
	}

	if ('writeErrors' in error && Array.isArray(error.writeErrors) && error.writeErrors.length) {
		return error.writeErrors.every((writeError) => isObject(writeError) && hasCode(writeError, MongoErrorCode.DuplicateKey));
	}

	return hasCode(error, MongoErrorCode.DuplicateKey);
};

export const isCursorNotFoundError = (error: unknown): boolean => isObject(error) && hasCode(error, MongoErrorCode.CursorNotFound);
