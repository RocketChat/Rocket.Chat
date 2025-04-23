import type { AppLogsProps } from '@rocket.chat/rest-typings';

export function makeAppLogsQuery(appId: string, queryParams: AppLogsProps) {
	const query: Record<string, any> = { appId };

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
