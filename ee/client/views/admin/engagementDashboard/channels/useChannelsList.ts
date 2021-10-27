import { useQuery } from 'react-query';

import { APIClient } from '../../../../../../app/utils/client/lib/RestApiClient';
import { Serialized } from '../../../../../../definition/Serialized';
import { Params, Return } from '../../../../../../definition/rest';
import { getPeriodRange, Period } from '../utils/periods';

const getChannelsList = async (
	params: Serialized<Params<'GET', '/v1/engagement-dashboard/channels/list'>[0]>,
): Promise<Serialized<Return<'GET', '/v1/engagement-dashboard/channels/list'>>> =>
	APIClient.get('/v1/engagement-dashboard/channels/list', params);

export const useChannelsList = ({
	period,
	offset,
	count,
}: {
	period: Period['key'];
	offset: number;
	count: number;
}) => {
	const fetchChannelsList = async () => {
		const { start, end } = getPeriodRange(period);

		return {
			...(await getChannelsList({
				start: start.toISOString(),
				end: end.toISOString(),
				offset,
				count,
			})),
			start,
			end,
		};
	};

	return useQuery(
		['admin/engagement-dashboard/channels/list', { period, offset, count }],
		fetchChannelsList,
		{
			keepPreviousData: true,
			refetchInterval: 5 * 60 * 1000,
		},
	);
};
