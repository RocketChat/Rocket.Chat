import moment from 'moment';
import { useQuery } from 'react-query';

import { getFromRestApi } from '../../../../lib/getFromRestApi';

export const useHourlyChatActivity = ({
	displacement,
	utc,
}: {
	displacement: number;
	utc: boolean;
}) =>
	useQuery(
		['admin/engagement-dashboard/users/hourly-chat-activity', { displacement, utc }],
		async () => {
			const day = (utc ? moment.utc().endOf('day') : moment().endOf('day'))
				.subtract(displacement, 'days')
				.toDate();

			const response = await getFromRestApi(
				'/v1/engagement-dashboard/users/chat-busier/hourly-data',
			)({
				start: day.toISOString(),
			});

			return response
				? {
						...response,
						day,
				  }
				: undefined;
		},
		{
			refetchInterval: 5 * 60 * 1000,
		},
	);
