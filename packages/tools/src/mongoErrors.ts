import { isObject } from './isObject';

export const MongoErrorCode = {
	DuplicateKey: 11000,
	CursorNotFound: 43,
	WriteConflict: 112,
} as const;

type MongoServerErrorLike = {
	code?: number;
	codeName?: string;
};

type MongoBulkWriteErrorLike = {
	code?: number;
	writeErrors?: Array<{ code?: number; codeName?: string }>;
	result?: { insertedCount?: number };
};

export const isMongoServerError = (error: unknown): error is MongoServerErrorLike =>
	isObject(error) && ('code' in error || 'codeName' in error);

export const isMongoBulkWriteError = (error: unknown): error is MongoBulkWriteErrorLike => isObject(error) && 'writeErrors' in error;
