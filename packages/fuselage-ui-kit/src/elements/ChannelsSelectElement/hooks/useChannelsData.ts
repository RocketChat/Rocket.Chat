import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

type useChannelsDataProps = {
  filter: string;
};

type useChannelsDataReturn = {
  _id: string;
  t: string;
  name?: string;
  fname?: string;
  avatarETag?: string;
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
    () => getRooms(generateQuery(filter)),
    {
      keepPreviousData: true,
    }
  );

  const result = data?.items.map(({ fname, name, _id, avatarETag, t }) => ({
    _id,
    name: name || fname,
    t,
    avatarETag,
  }));

  return result || [];
};
