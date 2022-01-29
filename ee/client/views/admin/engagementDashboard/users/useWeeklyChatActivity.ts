import moment from 'moment';
import { useQuery } from 'react-query';

import { getFromRestApi } from '../../../../lib/getFromRestApi';

type UseWeeklyChatActivityOptions = {
	displacement: number;
	utc: boolean;
};

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const useWeeklyChatActivity = ({ displacement, utc }: UseWeeklyChatActivityOptions) =>
	useQuery(
		['admin/engagement-dashboard/users/weekly-chat-activity', { displacement, utc }],
		async () => {
			const day = (utc ? moment.utc().endOf('day') : moment().endOf('day')).subtract(displacement, 'weeks').toDate();

			const response = await getFromRestApi('/v1/engagement-dashboard/users/chat-busier/weekly-data')({
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
