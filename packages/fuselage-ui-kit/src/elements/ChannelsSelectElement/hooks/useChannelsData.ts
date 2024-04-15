import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

type useChannelsDataProps = {
  filter: string;
};

type useChannelsDataReturn = {
  value: string;
  label: {
    name?: string;
    avatarETag?: string;
    type: string;
  };
}[];

const generateQuery = (
  term = ''
): {
  selector: string;
} => ({ selector: JSON.stringify({ name: term }) });

export const useChannelsData = ({
  filter,
}: useChannelsDataProps): useChannelsDataReturn => {
  const getRooms = useEndpoint(
    'GET',
    '/v1/rooms.autocomplete.channelAndPrivate'
  );

  const { data } = useQuery(
    ['rooms.autocomplete.channelAndPrivate', filter],
    async () =>
      (await getRooms(generateQuery(filter))).items.map(
        ({ fname, name, _id, avatarETag, t }) => ({
          value: _id,
          label: { name: name || fname, avatarETag, type: t },
        })
      ),
    {
      keepPreviousData: true,
    }
  );

  return data || [];
};
