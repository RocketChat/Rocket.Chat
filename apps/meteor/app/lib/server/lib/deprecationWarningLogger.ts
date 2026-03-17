import { Logger } from '@rocket.chat/logger';
import type { PathPattern } from '@rocket.chat/rest-typings';
import semver from 'semver';

import { metrics } from '../../../metrics/server/lib/metrics';

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

export type DeprecationLoggerNextPlannedVersion = '9.0.0';

export const apiDeprecationLogger = ((logger) => {
	return {
		endpoint: (endpoint: string, version: DeprecationLoggerNextPlannedVersion, res: Response, info = '') => {
			const message = `The endpoint "${endpoint}" is deprecated and will be removed on version ${version}${info ? ` (${info})` : ''}`;

			if (process.env.TEST_MODE === 'true') {
				throw new Error(message);
			}

			compareVersions(version, message);

			writeDeprecationHeader(res, 'endpoint-deprecation', message, version);

			metrics.deprecations.inc({ type: 'deprecation', kind: 'endpoint', name: endpoint });

			logger.warn({ msg: message, endpoint, version, info });
		},
		parameter: (
			endpoint: string,
			parameter: string,
			version: DeprecationLoggerNextPlannedVersion,
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

			if (process.env.TEST_MODE === 'true') {
				throw new Error(message);
			}

			metrics.deprecations.inc({ type: 'parameter-deprecation', kind: 'endpoint', name: endpoint, params: parameter });

			writeDeprecationHeader(res, 'parameter-deprecation', message, version);

			logger.warn({ msg: message, endpoint, parameter, version });
		},

		deprecatedParameterUsage: (
			endpoint: string,
			parameter: string,
			version: DeprecationLoggerNextPlannedVersion,
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

			compareVersions(version, message);

			metrics.deprecations.inc({ type: 'invalid-usage', kind: 'endpoint', name: endpoint, params: parameter });

			writeDeprecationHeader(res, 'invalid-usage', message, version);

			logger.warn({ msg: message, endpoint, parameter, version });
		},
	};
})(deprecationLogger.section('API'));

export const methodDeprecationLogger = ((logger) => {
	return {
		method: <T extends string | PathPattern>(
			method: string,
			version: DeprecationLoggerNextPlannedVersion,
			info: T extends `/${string}` ? (T extends PathPattern ? T : never) : string,
		) => {
			const replacement = typeof info === 'string' ? info : `Use the ${info} endpoint instead`;
			const message = `The method "${method}" is deprecated and will be removed on version ${version}${replacement ? ` (${replacement})` : ''}`;
			if (process.env.TEST_MODE === 'true') {
				throw new Error(message);
			}
			compareVersions(version, message);
			metrics.deprecations.inc({ type: 'deprecation', name: method, kind: 'method' });
			logger.warn({ msg: message, method, version, replacement });
		},
		parameter: (method: string, parameter: string, version: DeprecationLoggerNextPlannedVersion) => {
			const message = `The parameter "${parameter}" in the method "${method}" is deprecated and will be removed on version ${version}`;
			if (process.env.TEST_MODE === 'true') {
				throw new Error(message);
			}

			metrics.deprecations.inc({ type: 'parameter-deprecation', name: method, params: parameter });

			compareVersions(version, message);
			logger.warn({ msg: message, method, parameter, version });
		},
		deprecatedParameterUsage: (
			method: string,
			parameter: string,
			version: DeprecationLoggerNextPlannedVersion,
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

			compareVersions(version, message);

			metrics.deprecations.inc({ type: 'invalid-usage', name: method, params: parameter, kind: 'method' });

			logger.warn({ msg: message, method, parameter, version });
		},
		/** @deprecated */
		warn: (message: string) => {
			if (process.env.TEST_MODE === 'true') {
				throw new Error(message);
			}

			compareVersions('0.0.0', message);
			logger.warn({ msg: message });
		},
	};
})(deprecationLogger.section('METHOD'));

export const streamDeprecationLogger = deprecationLogger.section('STREAM');
