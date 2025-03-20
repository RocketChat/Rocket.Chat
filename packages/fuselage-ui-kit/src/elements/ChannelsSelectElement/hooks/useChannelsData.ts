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

export const useChannelsData = ({ filter }: useChannelsDataProps) => {
  const getRooms = useEndpoint(
    'GET',
    '/v1/rooms.autocomplete.channelAndPrivate',
  );

  const { data } = useQuery({
    queryKey: ['rooms.autocomplete.channelAndPrivate', filter],

    queryFn: async () => {
      const channels = await getRooms(generateQuery(filter));

      const options = channels.items.map(
        ({ fname, name, _id, avatarETag, t }) => ({
          value: _id,
          label: { name: name || fname, avatarETag, type: t },
        }),
      );

      return options || [];
    },

    placeholderData: keepPreviousData,
  });

  return data;
};
