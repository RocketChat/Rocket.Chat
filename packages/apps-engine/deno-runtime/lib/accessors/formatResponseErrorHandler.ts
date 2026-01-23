import { ErrorObject } from 'jsonrpc-lite';

// deno-lint-ignore no-explicit-any -- that is the type we get from `catch`
export const formatErrorResponse = (error: any): Error => {
	if (error instanceof ErrorObject || typeof error?.error?.message === 'string') {
		return new Error(error.error.message);
	}

	if (error instanceof Error) {
		return error;
	}

	return new Error('An unknown error occurred', { cause: error });
};
