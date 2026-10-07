import { ajv } from '@rocket.chat/rest-typings';
import type { ValidateFunction } from 'ajv';
import type { Context } from 'hono';

import { MatrixRTCTokenError } from '../../matrixrtc/tokens/errors';
import { logger } from '../logger';

const isMatrixErrorResponseProps = ajv.compile<{ errcode: string; error: string }>({
	type: 'object',
	properties: { errcode: { type: 'string' }, error: { type: 'string' } },
	required: ['errcode', 'error'],
});

/** Every answer a MatrixRTC token endpoint gives: the token, or a refusal in the Matrix error format. */
export const tokenEndpointResponses = <T>(isGrantResponseProps: ValidateFunction<T>) => ({
	200: isGrantResponseProps,
	400: isMatrixErrorResponseProps,
	401: isMatrixErrorResponseProps,
	403: isMatrixErrorResponseProps,
	404: isMatrixErrorResponseProps,
	500: isMatrixErrorResponseProps,
	502: isMatrixErrorResponseProps,
});

/** The JSON body of a token request; a body that is not JSON is refused as lk-jwt-service refuses it. */
export async function readTokenRequestBody(c: Context): Promise<unknown> {
	try {
		return await c.req.json();
	} catch {
		throw new MatrixRTCTokenError(400, 'M_NOT_JSON', 'Error reading request');
	}
}

/** Answers with what `grant` gives, or with the reason it refused. */
export async function answerTokenRequest<T>(grant: () => Promise<T>) {
	try {
		return { statusCode: 200 as const, body: await grant() };
	} catch (err) {
		if (err instanceof MatrixRTCTokenError) {
			return { statusCode: err.status, body: { errcode: err.errcode, error: err.message } };
		}

		logger.error({ msg: 'MatrixRTC token request failed', err });
		return { statusCode: 500 as const, body: { errcode: 'M_UNKNOWN', error: 'Internal Server Error' } };
	}
}
