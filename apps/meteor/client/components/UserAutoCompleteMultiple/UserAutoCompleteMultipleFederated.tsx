import type { OptionType } from '@rocket.chat/fuselage';
import { MultiSelectFiltered, Icon, Box, Chip } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { ReactElement, AllHTMLAttributes } from 'react';
import React, { memo, useState, useCallback, useMemo, useRef, useEffect } from 'react';

import AutocompleteOptions, { OptionsContext } from './UserAutoCompleteMultipleOptions';

type UserAutoCompleteMultipleFederatedProps = {
  onChange: (value: Array<string>) => void;
  value: Array<string>;
  placeholder?: string;
} & Omit<AllHTMLAttributes<HTMLElement>, 'is' | 'onChange'>;

type UserAutoCompleteOptionType = {
  name: string;
  username: string;
  _federated?: boolean;
};

type UserAutoCompleteOptions = {
  [k: string]: UserAutoCompleteOptionType;
};

const matrixRegex = new RegExp('@(.*:.*)');

const UserAutoCompleteMultipleFederated = ({
  onChange,
  value,
  placeholder,
  ...props
}: UserAutoCompleteMultipleFederatedProps): ReactElement => {
  const [filter, setFilter] = useState('');
  const [selectedCache, setSelectedCache] = useState<UserAutoCompleteOptions>({});
  const [dropUp, setDropUp] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const debouncedFilter = useDebouncedValue(filter, 500);
  const getUsers = useEndpoint('GET', '/v1/users.autocomplete');

  const { data } = useQuery({
    queryKey: ['users.autocomplete', debouncedFilter],

    queryFn: async () => {
      const users = await getUsers({ selector: JSON.stringify({ term: debouncedFilter }) });
      const options = users.items.map((item): [string, UserAutoCompleteOptionType] => [item.username, item]);

      // Add extra option if filter text matches `username:server`
      // Used to add federated users that do not exist yet
      if (matrixRegex.test(debouncedFilter)) {
        options.unshift([debouncedFilter, { name: debouncedFilter, username: debouncedFilter, _federated: true }]);
      }

      return options;
    },

    placeholderData: keepPreviousData,
  });

  const options = useMemo(() => data || [], [data]);

  const onAddUser = useCallback(
    (username: string): void => {
      const user = options.find(([val]) => val === username)?.[1];
      if (!user) {
        throw new Error('UserAutoCompleteMultiple - onAddSelected - failed to cache option');
      }
      setSelectedCache((selectedCache) => ({ ...selectedCache, [username]: user }));
    },
    [setSelectedCache, options],
  );

  const onRemoveUser = useCallback(
    (username: string): void =>
      setSelectedCache((selectedCache) => {
        const users = { ...selectedCache };
        delete users[username];
        return users;
      }),
    [setSelectedCache],
  );

  const handleOnChange = useCallback(
    (usernames: string[]) => {
      onChange(usernames);
      const newAddedUsername = usernames.find((username) => !value.includes(username));
      const removedUsername = value.find((username) => !usernames.includes(username));
      setFilter('');
      newAddedUsername && onAddUser(newAddedUsername);
      removedUsername && onRemoveUser(removedUsername);
    },
    [onChange, setFilter, onAddUser, onRemoveUser, value],
  );

  const toggleDropDirection = () => {
    setDropUp((prev) => !prev);
  };

  // Function to adjust dropdown position
  const adjustDropdownPosition = () => {
    if (dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const dropdownHeight = 200; // Approximate height of the dropdown
      const spaceBelow = window.innerHeight - rect.bottom;

      if (!dropUp && spaceBelow < dropdownHeight) {
        setDropUp(true);
      }
    }
  };

  // Click-outside detection
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setFilter(''); // Close the dropdown by clearing the filter
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Adjust dropdown position
  useEffect(() => {
    adjustDropdownPosition();

    if (filter) {
      window.addEventListener('resize', adjustDropdownPosition);
    } else {
      window.removeEventListener('resize', adjustDropdownPosition);
    }

    return () => {
      window.removeEventListener('resize', adjustDropdownPosition);
    };
  }, [filter, dropUp]);

  return (
    <div ref={dropdownRef} style={{ width: '100%' }}>
      <style>
        {`
          .dropup .rcx-options {
            top: auto;
            bottom: 100%;
          }
        `}
      </style>
      <OptionsContext.Provider value={{ options: options as unknown as OptionType[] }}>
        <MultiSelectFiltered
          {...props}
          style={{ width: '100%' }}
          data-qa-type='user-auto-complete-input'
          placeholder={placeholder}
          value={value}
          onChange={handleOnChange}
          filter={filter}
          setFilter={setFilter}
          className={dropUp ? 'dropup' : ''}
          renderSelected={({ value, onMouseDown }: { value: string; onMouseDown: () => void }) => {
            const currentCachedOption = selectedCache[value] || {};

            return (
              <Chip key={value} height='x20' onMouseDown={onMouseDown} mie={4} mb={2}>
                {currentCachedOption._federated ? (
                  <Icon size='x20' name='globe' />
                ) : (
                  <UserAvatar size='x20' username={value} />
                )}
                <Box is='span' margin='none' mis={4}>
                  {currentCachedOption.name || currentCachedOption.username || value}
                </Box>
              </Chip>
            );
          }}
          renderOptions={AutocompleteOptions}
          options={options.concat(Object.entries(selectedCache)).map(([, item]) => [
            item.username,
            item.name || item.username,
          ])}
          data-qa='create-channel-users-autocomplete'
          addon={
            <Icon
              name={dropUp ? 'chevron-up' : 'chevron-down'}
              size='x20'
              onClick={(e) => {
                e.stopPropagation();
                toggleDropDirection();
              }}
            />
          }
        />
      </OptionsContext.Provider>
    </div>
  );
};

export default memo(UserAutoCompleteMultipleFederated);
