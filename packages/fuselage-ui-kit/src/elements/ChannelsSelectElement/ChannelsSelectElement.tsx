import { AutoComplete, Option, Box, Options } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { RoomAvatar } from '@rocket.chat/ui-avatar';
import type * as UiKit from '@rocket.chat/ui-kit';
import { memo, useCallback, useMemo, useState } from 'react';

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

  const data = useChannelsData({ filter: filterDebounced });

  const options = useMemo(
    () =>
      data.map(({ name, _id, avatarETag, t }) => ({
        value: _id,
        label: { name, avatarETag, type: t },
      })),
    [data]
  );

  const handleChange = useCallback(
    (value) => {
      action({ target: { value } });
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
        <>
          <Box margin='none' mi={2}>
            <RoomAvatar
              size='x20'
              room={{ type: label?.type || 'c', _id: value, ...label }}
            />
          </Box>
          <Box margin='none' mi={2}>
            {label?.name}
          </Box>
        </>
      )}
      renderItem={({ value, label, ...props }) => (
        <Option
          key={value}
          {...props}
          label={label.name}
          avatar={
            <RoomAvatar
              size={Options.AvatarSize}
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
