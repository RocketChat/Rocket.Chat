import { AutoComplete, Box, Chip, Option } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import type * as UiKit from '@rocket.chat/ui-kit';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';

import { useUiKitState } from '../../hooks/useUiKitState';
import type { BlockProps } from '../../utils/BlockProps';

type UsersSelectElementProps = BlockProps<UiKit.UsersSelectElement>;

type UserAutoCompleteOptionType = {
  value: string;
  label: string;
};

const UsersSelectElement = ({ block, context }: UsersSelectElementProps) => {
  const [{ loading, value }, action] = useUiKitState(block, context);

  const [filter, setFilter] = useState('');
  const debouncedFilter = useDebouncedValue(filter, 1000);
  const getUsers = useEndpoint('GET', '/v1/users.autocomplete');

  const { data } = useQuery(
    ['users.autoComplete', debouncedFilter],
    async () => {
      const users = await getUsers({
        selector: JSON.stringify({ term: debouncedFilter }),
      });
      const options = users.items.map(
        (item): UserAutoCompleteOptionType => ({
          value: item.username,
          label: item.name || item.username,
        })
      );

      return options;
    },
    { keepPreviousData: true }
  );

  const options = useMemo(() => data || [], [data]);

  const handleChange = useCallback(
    (value) => {
      action({ target: { value } });
    },
    [action]
  );

  return (
    <AutoComplete
      disabled={loading}
      value={value as UserAutoCompleteOptionType['value']}
      options={options}
      onChange={handleChange}
      filter={filter}
      setFilter={setFilter}
      data-qa-id='UserAutoComplete'
      renderSelected={({ selected: { value, label } }) => (
        <Chip height='x20' value={value} mie={4}>
          <UserAvatar size='x20' username={value} />
          <Box verticalAlign='middle' is='span' margin='none' mi={4}>
            {label}
          </Box>
        </Chip>
      )}
      renderItem={({ value, label, ...props }) => (
        <Option
          key={value}
          label={label}
          avatar={<UserAvatar size='x20' username={value} />}
          {...props}
        />
      )}
    />
  );
};

export default UsersSelectElement;
