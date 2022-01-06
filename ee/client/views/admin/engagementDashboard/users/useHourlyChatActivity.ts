import moment from 'moment';
import { useQuery } from 'react-query';

import { getFromRestApi } from '../../../../lib/getFromRestApi';

type UseHourlyChatActivityOptions = {
	displacement: number;
	utc: boolean;
};

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const useHourlyChatActivity = ({ displacement, utc }: UseHourlyChatActivityOptions) =>
	useQuery(
		['admin/engagement-dashboard/users/hourly-chat-activity', { displacement, utc }],
		async () => {
			const day = (utc ? moment.utc().endOf('day') : moment().endOf('day')).subtract(displacement, 'days').toDate();

			const response = await getFromRestApi('/v1/engagement-dashboard/users/chat-busier/hourly-data')({
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
