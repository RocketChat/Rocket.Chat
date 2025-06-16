import type { Context } from 'elysia';
import { createLogger } from '../utils/logger';
import { MatrixError } from '../errors';

const logger = createLogger('ErrorHandler');

export interface ErrorResponse {
	errcode: string;
	error: string;
	details?: any;
}

export function handleError(error: unknown, context: Context): ErrorResponse {
	// Log the error
	logger.error('Request error:', error);

	// Handle Matrix-specific errors
	if (error instanceof MatrixError) {
		context.set.status(parseInt(error.statusCode, 10) || 500);
		return {
			errcode: error.errcode || 'M_UNKNOWN',
			error: error.message,
		};
	}

	// Handle validation errors
	if (error instanceof Error && error.name === 'ValidationError') {
		context.set.status(400);
		return {
			errcode: 'M_BAD_JSON',
			error: 'Invalid request body',
			details: error.message,
		};
	}

	// Handle not found errors
	if (error instanceof Error && error.message.includes('not found')) {
		context.set.status(404);
		return {
			errcode: 'M_NOT_FOUND',
			error: error.message,
		};
	}

	// Handle unauthorized errors
	if (error instanceof Error && error.message.includes('unauthorized')) {
		context.set.status(401);
		return {
			errcode: 'M_UNAUTHORIZED',
			error: 'Unauthorized',
		};
	}

	// Generic error handling
	context.set.status(500);
	return {
		errcode: 'M_UNKNOWN',
		error: error instanceof Error ? error.message : 'Internal server error',
	};
}

// Elysia error handler plugin
export const errorHandler = {
	name: 'error-handler',
	seed: (app: any) => {
		app.onError(({ error, set }: any) => {
			return handleError(error, { set });
		});
	},
};