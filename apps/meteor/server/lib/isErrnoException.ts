import { isArbitraryObject } from '../../lib/utils/isArbitraryObject';

export const isErrnoException = (error: unknown): error is NodeJS.ErrnoException => {
	return (
		isArbitraryObject(error) &&
		error instanceof Error &&
		(typeof error.errno === 'number' || typeof error.errno === 'undefined') &&
		(typeof error.code === 'string' || typeof error.code === 'undefined') &&
		(typeof error.path === 'string' || typeof error.path === 'undefined') &&
		(typeof error.syscall === 'string' || typeof error.syscall === 'undefined')
	);
};
