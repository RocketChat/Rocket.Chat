import { AutoComplete, Option, Chip, Box } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { RoomAvatar } from '@rocket.chat/ui-avatar';
import type * as UiKit from '@rocket.chat/ui-kit';
import { memo, useCallback, useState } from 'react';

import { useUiKitState } from '../../hooks/useUiKitState';
import type { BlockProps } from '../../utils/BlockProps';
import { useChannelsData } from './hooks/useChannelsData';

type MultiChannelsSelectProps = BlockProps<UiKit.MultiChannelsSelectElement>;

const MultiChannelsSelectElement = ({
  block,
  context,
}: MultiChannelsSelectProps) => {
  const [{ value, loading }, action] = useUiKitState(block, context);

  const [filter, setFilter] = useState('');
  const filterDebounced = useDebouncedValue(filter, 300);

  const options = useChannelsData({ filter: filterDebounced });

  const handleChange = useCallback(
    (value: string | string[]) => {
      if (Array.isArray(value)) action({ target: { value } });
    },
    [action]
  );

  return (
    <AutoComplete
      value={value || []}
      disabled={loading}
      onChange={handleChange}
      filter={filter}
      setFilter={setFilter}
      multiple
      renderSelected={({ selected: { value, label }, onRemove, ...props }) => (
        <Chip key={value} {...props} value={value} onClick={onRemove}>
          <RoomAvatar
            size='x20'
            room={{ type: label?.type || 'c', _id: value, ...label }}
          />
          <Box is='span' margin='none' mis={4}>
            {label?.name}
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
              room={{ type: label?.type || 'c', _id: value, ...label }}
            />
          }
        />
      )}
      options={options}
    />
  );
};

export default memo(MultiChannelsSelectElement);
