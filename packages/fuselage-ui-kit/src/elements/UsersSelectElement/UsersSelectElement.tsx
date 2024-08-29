import { AutoComplete, Box, Chip, Option } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import type * as UiKit from '@rocket.chat/ui-kit';
import { useCallback, useState } from 'react';

import { useUiKitState } from '../../hooks/useUiKitState';
import type { BlockProps } from '../../utils/BlockProps';
import { useUsersData } from './hooks/useUsersData';

type UsersSelectElementProps = BlockProps<UiKit.UsersSelectElement>;

export type UserAutoCompleteOptionType = {
  value: string;
  label: string;
};

const UsersSelectElement = ({ block, context }: UsersSelectElementProps) => {
  const [{ value, loading }, action] = useUiKitState(block, context);

  const [filter, setFilter] = useState('');
  const debouncedFilter = useDebouncedValue(filter, 300);

  const data = useUsersData({ filter: debouncedFilter });

  const handleChange = useCallback(
    (value: string | string[]) => {
      if (!Array.isArray(value)) action({ target: { value } });
    },
    [action]
  );

  return (
    <AutoComplete
      value={value}
      placeholder={block.placeholder?.text}
      disabled={loading}
      options={data}
      onChange={handleChange}
      filter={filter}
      setFilter={setFilter}
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
          {...props}
          label={label}
          avatar={<UserAvatar username={value} size='x20' />}
        />
      )}
    />
  );
};

export default UsersSelectElement;
