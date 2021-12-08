import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { statisticsByGroups } from '../lib/statisticsByGroups';

export async function getStatisticsByGroups({ userId, query = {} }) {
	if (!await hasPermissionAsync(userId, 'view-statistics')) {
		throw new Error('error-not-allowed');
	}

	const { dateFrom, dateTo } = query;
	const parsedDateFrom = Date.parse(dateFrom);
	const parsedDateTo = Date.parse(dateTo);
	if (isNaN(parsedDateFrom) || isNaN(parsedDateTo))	{
		throw new Error('error-invalid-params', 'The "dateFrom" and "dateTo" parameters must be provided.');
	}

	return statisticsByGroups.get(new Date(parsedDateFrom), new Date(parsedDateTo));
}
