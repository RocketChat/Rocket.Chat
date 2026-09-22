import { isErrorObject } from '@rocket.chat/apps/protocol/dist/framing/jsonrpc';

export const formatErrorResponse = (error: any): Error => {
	if (isErrorObject(error) || typeof error?.error?.message === 'string') {
		return new Error(error.error.message);
	}

	if (error instanceof Error) {
		return error;
	}

	return new Error('An unknown error occurred', { cause: error });
};
