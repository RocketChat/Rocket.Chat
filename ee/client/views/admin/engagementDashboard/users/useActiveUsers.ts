import moment from 'moment';
import { useQuery } from 'react-query';

import { getFromRestApi } from '../../../../lib/getFromRestApi';
import { getPeriodRange } from '../utils/periods';

export const useActiveUsers = ({ utc }: { utc: boolean }) =>
	useQuery(
		['admin/engagement-dashboard/users/active', { utc }],
		async () => {
			const { start, end } = getPeriodRange('last 30 days', utc);

			const response = await getFromRestApi('/v1/engagement-dashboard/users/active-users')({
				start: (utc ? moment.utc(start) : moment(start)).subtract(29, 'days').toISOString(),
				end: end.toISOString(),
			});

			return response
				? {
						...response,
						start,
						end,
				  }
				: undefined;
		},
		{
			refetchInterval: 5 * 60 * 1000,
		},
	);
