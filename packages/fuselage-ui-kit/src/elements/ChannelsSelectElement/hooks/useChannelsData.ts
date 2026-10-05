import type { IRoom } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { keepPreviousData, useQueries, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

type useChannelsDataProps = {
	filter: string;
	enabled?: boolean;
	selected?: string[];
};

type ChannelOption = { value: string; label: { name: string | undefined; avatarETag: string | undefined; type: IRoom['t'] } };

const generateQuery = (
	term = '',
): {
	selector: string;
} => ({ selector: JSON.stringify({ name: term }) });

/** Options matching the filter, plus the selected rooms, so their chips render even when the search does not return them. */
export const useChannelsData = ({ filter, enabled = true, selected = [] }: useChannelsDataProps) => {
	const getRooms = useEndpoint('GET', '/v1/rooms.autocomplete.channelAndPrivate');
	const getRoomInfo = useEndpoint('GET', '/v1/rooms.info');

	const { data } = useQuery({
		queryKey: ['rooms.autocomplete.channelAndPrivate', filter],

		queryFn: async () => {
			const channels = await getRooms(generateQuery(filter));

			const options = channels.items.map(({ fname, name, _id, avatarETag, t }): ChannelOption => ({
				value: _id,
				label: { name: name || fname, avatarETag, type: t },
			}));

			return options || [];
		},

		placeholderData: keepPreviousData,
		enabled,
	});

	const missing = enabled ? selected.filter((roomId) => !data?.some(({ value }) => value === roomId)) : [];

	const selectedOptions = useQueries({
		queries: missing.map((roomId) => ({
			queryKey: ['rooms.info', roomId],
			queryFn: async (): Promise<ChannelOption> => {
				const { room } = await getRoomInfo({ roomId });
				return { value: roomId, label: { name: room?.name || room?.fname || roomId, avatarETag: room?.avatarETag, type: room?.t ?? 'c' } };
			},
			staleTime: Infinity,
		})),
		combine: (results) => results.flatMap(({ data }) => (data ? [data] : [])),
	});

	return useMemo(() => (data ? [...data, ...selectedOptions] : selectedOptions), [data, selectedOptions]);
};
