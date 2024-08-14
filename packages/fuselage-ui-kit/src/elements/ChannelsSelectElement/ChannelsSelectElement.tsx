import { AutoComplete, Option, Box, Chip } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { RoomAvatar } from '@rocket.chat/ui-avatar';
import type * as UiKit from '@rocket.chat/ui-kit';
import { memo, useCallback, useState } from 'react';

import { useUiKitState } from '../../hooks/useUiKitState';
import type { BlockProps } from '../../utils/BlockProps';
import { useChannelsData } from './hooks/useChannelsData';

type ChannelsSelectElementProps = BlockProps<UiKit.ChannelsSelectElement>;

const ChannelsSelectElement = ({
  block,
  context,
}: ChannelsSelectElementProps) => {
  const [{ value, loading }, action] = useUiKitState(block, context);

  const [filter, setFilter] = useState('');
  const filterDebounced = useDebouncedValue(filter, 300);

  const options = useChannelsData({ filter: filterDebounced });

  const handleChange = useCallback(
    (value: string | string[]) => {
      if (!Array.isArray(value)) action({ target: { value } });
    },
    [action]
  );

  return (
    <AutoComplete
      value={value}
      onChange={handleChange}
      disabled={loading}
      filter={filter}
      setFilter={setFilter}
      renderSelected={({ selected: { value, label } }) => (
        <Chip height='x20' value={value} mie={4}>
          <RoomAvatar
            size='x20'
            room={{ type: label?.type || 'c', _id: value, ...label }}
          />
          <Box verticalAlign='middle' is='span' margin='none' mi={4}>
            {label.name}
          </Box>
        </Chip>
      )}
      renderItem={({ value, label, ...props }) => (
        <Option
          key={value}
          {...props}
          label={label.name}
          avatar={
            <RoomAvatar
              size='x20'
              room={{
                type: label.type,
                _id: value,
                avatarETag: label.avatarETag,
              }}
              {...props}
            />
          }
        />
      )}
      options={options}
    />
  );
};

export default memo(ChannelsSelectElement);
