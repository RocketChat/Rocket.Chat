import type { AppLogsProps } from '@rocket.chat/rest-typings';

/**
 * Creates a query object for fetching app logs based on provided parameters.
 *
 * NOTE: This function expects that all values are in the correct format, as it is
 * used by an endpoint handler which has query parameter validation.
 *
 * @param queryParams - The query parameters.
 * @returns A query object for fetching app logs.
 * @throws {Error} If the date range is invalid.
 */
export function makeAppLogsQuery(queryParams: AppLogsProps) {
	const query: Record<string, any> = {};

	if (queryParams.appId) {
		query.appId = queryParams.appId;
	}

	if (queryParams.logLevel) {
		const queryLogLevel = Number(queryParams.logLevel);
		const logLevel = ['error'];

		if (queryLogLevel >= 1) {
			logLevel.push('warn', 'info', 'log');
		}

		if (queryLogLevel >= 2) {
			logLevel.push('debug', 'success');
		}

		query['entries.severity'] = { $in: logLevel };
	}

	if (queryParams.method) {
		query.method = queryParams.method;
	}

	if (queryParams.instanceId) {
		query.instanceId = queryParams.instanceId;
	}

	if (queryParams.startDate) {
		query._updatedAt = {
			$gte: new Date(queryParams.startDate),
		};
	}

	if (queryParams.endDate) {
		const endDate = new Date(queryParams.endDate);
		endDate.setDate(endDate.getDate() + 1);

		if (query._updatedAt?.$gte && query._updatedAt.$gte >= endDate) {
			throw new Error('Invalid date range');
		}

		query._updatedAt = {
			...(query._updatedAt || {}),
			$lte: endDate,
		};
	}

	return query;
}
