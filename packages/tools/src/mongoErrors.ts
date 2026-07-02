import { isRecord } from './isRecord';

export const MongoErrorCode = {
	DuplicateKey: 11000,
	CursorNotFound: 43,
	WriteConflict: 112,
} as const;

type MongoErrorLike = {
	code?: number;
	codeName?: string;
	writeErrors?: Array<{ code?: number; codeName?: string }>;
};

export const isMongoError = (error: unknown): error is MongoErrorLike =>
	isRecord(error) && ('code' in error || 'codeName' in error || 'writeErrors' in error);
