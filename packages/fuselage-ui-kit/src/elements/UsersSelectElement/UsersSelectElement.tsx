import { MultiSelectFiltered, Box, Chip } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import type * as UiKit from '@rocket.chat/ui-kit';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { memo, useState, useCallback, useMemo } from 'react';

import { useStringFromTextObject } from '../../hooks/useStringFromTextObject';
import { useUiKitState } from '../../hooks/useUiKitState';
import type { BlockProps } from '../../utils/BlockProps';
import AutocompleteOptions, {
  OptionsContext,
} from './UserAutoCompleteMultipleOptions';

type UsersSelectElementProps = BlockProps<UiKit.UsersSelectElement>;

type UserAutoCompleteOptionType = {
  name: string;
  username: string;
  _federated?: boolean;
};

type UserAutoCompleteOptions = {
  [k: string]: UserAutoCompleteOptionType;
};

const matrixRegex = new RegExp('@(.*:.*)');

const UsersSelectElement = ({
  block,
  context,
}: UsersSelectElementProps): ReactElement => {
  const [{ loading, value, error }, action] = useUiKitState(block, context);
  const fromTextObjectToString = useStringFromTextObject();
  const [filter, setFilter] = useState('');
  const [selectedCache, setSelectedCache] = useState<UserAutoCompleteOptions>(
    {}
  );

  const debouncedFilter = useDebouncedValue(filter, 500);
  const getUsers = useEndpoint('GET', '/v1/users.autocomplete');

  const { data } = useQuery(
    ['users.autocomplete', debouncedFilter],
    async () => {
      const users = await getUsers({
        selector: JSON.stringify({ term: debouncedFilter }),
      });
      const options = users.items.map(
        (item): [string, UserAutoCompleteOptionType] => [item.username, item]
      );

      // Add extra option if filter text matches `username:server`
      // Used to add federated users that do not exist yet
      if (matrixRegex.test(debouncedFilter)) {
        options.unshift([
          debouncedFilter,
          {
            name: debouncedFilter,
            username: debouncedFilter,
            _federated: true,
          },
        ]);
      }

      return options;
    },
    { keepPreviousData: true }
  );

  const options = useMemo(() => data || [], [data]);

  const onAddUser = useCallback(
    (username: string): void => {
      const user = options.find(([val]) => val === username)?.[1];
      if (!user) {
        throw new Error(
          'UserAutoCompleteMultiple - onAddSelected - failed to cache option'
        );
      }
      setSelectedCache((selectedCache) => ({
        ...selectedCache,
        [username]: user,
      }));
    },
    [setSelectedCache, options]
  );

  const onRemoveUser = useCallback(
    (username: string): void =>
      setSelectedCache((selectedCache) => {
        const users = { ...selectedCache };
        delete users[username];
        return users;
      }),
    [setSelectedCache]
  );

  const handleChange = useCallback(
    (value) => {
      action({ target: { value } });
    },
    [action]
  );

  const handleOnChange = useCallback(
    (usernames: string[]) => {
      handleChange(usernames);
      const newAddedUsername = usernames.filter(
        (username) => !value.includes(username)
      )[0];
      const removedUsername = value.filter(
        (username) => !usernames.includes(username)
      )[0];
      setFilter('');
      newAddedUsername && onAddUser(newAddedUsername);
      removedUsername && onRemoveUser(removedUsername);
    },
    [handleChange, setFilter, onAddUser, onRemoveUser, value]
  );

  return (
    <OptionsContext.Provider value={{ options }}>
      <MultiSelectFiltered
        error={error}
        disabled={loading}
        data-qa-type='user-auto-complete-input'
        placeholder={fromTextObjectToString(block.placeholder)}
        value={value}
        onChange={handleOnChange}
        filter={filter}
        setFilter={setFilter}
        renderSelected={({
          value,
          onMouseDown,
        }: {
          value: string;
          onMouseDown: () => void;
        }) => {
          const currentCachedOption = selectedCache[value] || {};

          return (
            <Chip
              key={value}
              height='x20'
              onMouseDown={onMouseDown}
              mie={4}
              mb={2}
            >
              <Box is='span' margin='none' mis={4}>
                {currentCachedOption.name ||
                  currentCachedOption.username ||
                  value}
              </Box>
            </Chip>
          );
        }}
        renderOptions={AutocompleteOptions}
        options={options
          .concat(Object.entries(selectedCache))
          .map(([, item]) => [item.username, item.name || item.username])}
        data-qa='create-channel-users-autocomplete'
      />
    </OptionsContext.Provider>
  );
};

export default memo(UsersSelectElement);
