import type { Response } from 'express';

import { Logger } from '../../../logger/server';

const deprecationLogger = new Logger('DeprecationWarning');

type MessageFn<T> = (params: { parameter: string; version: string } & T) => string;

export const apiDeprecationLogger = ((logger) => {
	return {
		endpoint: (endpoint: string, version: string, res: Response, info = '') => {
			const message = `The endpoint "${endpoint}" is deprecated and will be removed on version ${version}${info ? ` (${info})` : ''}`;

			if (process.env.TEST_MODE === 'true') {
				throw new Error(message);
			}

			if (res) {
				res.header('x-deprecation-type', 'endpoint-deprecation');
				res.header('x-deprecation-message', message);
				res.header('x-deprecation-version', version);
			}

			logger.warn(message);
		},
		parameter: (
			endpoint: string,
			parameter: string,
			version: string,
			res: Response,
			messageGenerator?: MessageFn<{ endpoint: string }>,
		) => {
			const message =
				messageGenerator?.({
					parameter,
					endpoint,
					version,
				}) ?? `The parameter "${parameter}" in the endpoint "${endpoint}" is deprecated and will be removed on version ${version}`;
			if (process.env.TEST_MODE === 'true') {
				throw new Error(message);
			}

			if (res) {
				res.header('x-deprecation-type', 'parameter-deprecation');
				res.header('x-deprecation-message', message);
				res.header('x-deprecation-version', version);
			}

			logger.warn(message);
		},

		deprecatedParameterUsage: (
			endpoint: string,
			parameter: string,
			version: string,
			res: Response,
			messageGenerator?: MessageFn<{
				endpoint: string;
			}>,
		) => {
			const message =
				messageGenerator?.({
					parameter,
					endpoint,
					version,
				}) ?? `The usage of the endpoint "${endpoint}" is deprecated and will be removed on version ${version}`;
			if (process.env.TEST_MODE === 'true') {
				throw new Error(message);
			}

			if (res) {
				res.header('x-deprecation-type', 'invalid-usage');
				res.header('x-deprecation-message', message);
				res.header('x-deprecation-version', version);
			}

			logger.warn(message);
		},
	};
})(deprecationLogger.section('API'));

export const methodDeprecationLogger = ((logger) => {
	return {
		method: (method: string, version: number) => {
			const message = `The method "${method}" is deprecated and will be removed on version ${version}`;
			if (process.env.TEST_MODE === 'true') {
				throw new Error(message);
			}
			logger.warn(message);
		},
		parameter: (method: string, parameter: string, version: number) => {
			const message = `The parameter "${parameter}" in the method "${method}" is deprecated and will be removed on version ${version}`;
			if (process.env.TEST_MODE === 'true') {
				throw new Error(message);
			}
			logger.warn(message);
		},
		deprecatedParameterUsage: (
			method: string,
			parameter: string,
			version: string,
			messageGenerator?: MessageFn<{
				method: string;
			}>,
		) => {
			const message =
				messageGenerator?.({
					parameter,
					method,
					version,
				}) ?? `The usage of the method "${method}" is deprecated and will be removed on version ${version}`;
			if (process.env.TEST_MODE === 'true') {
				throw new Error(message);
			}

			logger.warn(message);
		},
		/** @deprecated */
		warn: (message: string) => {
			if (process.env.TEST_MODE === 'true') {
				throw new Error(message);
			}
			logger.warn(message);
		},
	};
})(deprecationLogger.section('METHOD'));

export const streamDeprecationLogger = deprecationLogger.section('STREAM');
