import type { IRoom, Serialized } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

type useChannelsDataProps = {
	filter: string;
};

const generateQuery = (
	term = '',
): {
	selector: string;
} => ({ selector: JSON.stringify({ name: term }) });

/* The route is typed by its migrated implementation inside the meteor app
 * (apps/meteor/server/api/v1/rooms.ts augments `Endpoints` via
 * ExtractRoutesFromAPI), so the standalone `Endpoints` map from
 * @rocket.chat/rest-typings no longer declares it. This package compiles
 * without that augmentation and keeps its own minimal contract, mirroring
 * the server response. */
type RoomsAutocompleteChannelAndPrivateResponse = {
	items: Serialized<IRoom>[];
};

export const useChannelsData = ({ filter }: useChannelsDataProps) => {
	const getRooms = useEndpoint(
		'GET',
		'/v1/rooms.autocomplete.channelAndPrivate' as unknown as Parameters<typeof useEndpoint>[1],
	) as unknown as (params: { selector: string }) => Promise<RoomsAutocompleteChannelAndPrivateResponse>;

	const { data } = useQuery({
		queryKey: ['rooms.autocomplete.channelAndPrivate', filter],

		queryFn: async () => {
			const channels = await getRooms(generateQuery(filter));

			const options = channels.items.map(({ fname, name, _id, avatarETag, t }) => ({
				value: _id,
				label: { name: name || fname, avatarETag, type: t },
			}));

			return options || [];
		},

		placeholderData: keepPreviousData,
	});

	return data;
};
