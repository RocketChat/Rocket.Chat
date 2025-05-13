import { Logger } from '@rocket.chat/logger';
import semver from 'semver';

import { metrics } from '../../../metrics/server';

const deprecationLogger = new Logger('DeprecationWarning');

type MessageFn<T> = (params: { parameter: string; version: string } & T) => string;

const throwErrorsForVersionsUnder = process.env.ROCKET_CHAT_DEPRECATION_THROW_ERRORS_FOR_VERSIONS_UNDER;

const writeDeprecationHeader = (res: Response | undefined, type: string, message: string, version: string) => {
	if (res) {
		res.headers.set('x-deprecation-type', type);
		res.headers.set('x-deprecation-message', message);
		res.headers.set('x-deprecation-version', version);
	}
};

const compareVersions = (version: string, message: string) => {
	if (throwErrorsForVersionsUnder && semver.lte(version, throwErrorsForVersionsUnder)) {
		throw new Error(message);
	}
};

export const apiDeprecationLogger = ((logger) => {
	return {
		endpoint: (endpoint: string, version: string, res: Response, info = '') => {
			const message = `The endpoint "${endpoint}" is deprecated and will be removed on version ${version}${info ? ` (${info})` : ''}`;

			compareVersions(version, message);

			writeDeprecationHeader(res, 'endpoint-deprecation', message, version);

			metrics.deprecations.inc({ type: 'deprecation', kind: 'endpoint', name: endpoint });

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
			compareVersions(version, message);

			metrics.deprecations.inc({ type: 'parameter-deprecation', kind: 'endpoint', name: endpoint, params: parameter });

			writeDeprecationHeader(res, 'parameter-deprecation', message, version);

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
			compareVersions(version, message);

			metrics.deprecations.inc({ type: 'invalid-usage', kind: 'endpoint', name: endpoint, params: parameter });

			writeDeprecationHeader(res, 'invalid-usage', message, version);

			logger.warn(message);
		},
	};
})(deprecationLogger.section('API'));

export const methodDeprecationLogger = ((logger) => {
	return {
		method: (method: string, version: string, info = '') => {
			const message = `The method "${method}" is deprecated and will be removed on version ${version}${info ? ` (${info})` : ''}`;
			compareVersions(version, message);
			metrics.deprecations.inc({ type: 'deprecation', name: method, kind: 'method' });
			logger.warn(message);
		},
		parameter: (method: string, parameter: string, version: string) => {
			const message = `The parameter "${parameter}" in the method "${method}" is deprecated and will be removed on version ${version}`;

			metrics.deprecations.inc({ type: 'parameter-deprecation', name: method, params: parameter });

			compareVersions(version, message);
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
			compareVersions(version, message);

			metrics.deprecations.inc({ type: 'invalid-usage', name: method, params: parameter, kind: 'method' });

			logger.warn(message);
		},
		/** @deprecated */
		warn: (message: string) => {
			compareVersions('0.0.0', message);
			logger.warn(message);
		},
	};
})(deprecationLogger.section('METHOD'));

export const streamDeprecationLogger = deprecationLogger.section('STREAM');
