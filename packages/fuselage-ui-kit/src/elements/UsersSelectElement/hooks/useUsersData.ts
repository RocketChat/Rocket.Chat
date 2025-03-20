import { useEndpoint } from '@rocket.chat/ui-contexts';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import type { UserAutoCompleteOptionType } from '../UsersSelectElement';

type useUsersDataProps = {
  filter: string;
};

export const useUsersData = ({ filter }: useUsersDataProps) => {
  const getUsers = useEndpoint('GET', '/v1/users.autocomplete');

  const { data } = useQuery({
    queryKey: ['users.autoComplete', filter],

    queryFn: async () => {
      const users = await getUsers({
        selector: JSON.stringify({ term: filter }),
      });
      const options = users.items.map(
        (item): UserAutoCompleteOptionType => ({
          value: item.username,
          label: item.name || item.username,
        }),
      );

      return options || [];
    },

    placeholderData: keepPreviousData,
  });

  return data;
};
