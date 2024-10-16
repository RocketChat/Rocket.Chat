import {
  Box,
  Chip,
  AutoComplete,
  Option,
  OptionAvatar,
  OptionContent,
  OptionDescription,
} from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import type * as UiKit from '@rocket.chat/ui-kit';
import type { ReactElement } from 'react';
import { memo, useCallback, useState } from 'react';

import { useUiKitState } from '../../hooks/useUiKitState';
import type { BlockProps } from '../../utils/BlockProps';
import { useUsersData } from './hooks/useUsersData';

type MultiUsersSelectElementProps = BlockProps<UiKit.MultiUsersSelectElement>;

const MultiUsersSelectElement = ({
  block,
  context,
}: MultiUsersSelectElementProps): ReactElement => {
  const [{ loading, value }, action] = useUiKitState(block, context);
  const [filter, setFilter] = useState('');

  const debouncedFilter = useDebouncedValue(filter, 500);

  const data = useUsersData({ filter: debouncedFilter });

  const handleChange = useCallback(
    (value: string | string[]) => {
      if (Array.isArray(value)) action({ target: { value } });
    },
    [action]
  );

  return (
    <AutoComplete
      value={value || []}
      options={data}
      placeholder={block.placeholder?.text}
      disabled={loading}
      filter={filter}
      setFilter={setFilter}
      onChange={handleChange}
      multiple
      renderSelected={({
        selected: { value, label },
        onRemove,
        ...props
      }): ReactElement => (
        <Chip {...props} height='x20' value={value} onClick={onRemove} mie={4}>
          <UserAvatar size='x20' username={value} />
          <Box is='span' margin='none' mis={4}>
            {label}
          </Box>
        </Chip>
      )}
      renderItem={({ value, label, ...props }): ReactElement => (
        <Option key={value} {...props}>
          <OptionAvatar>
            <UserAvatar username={value} size='x20' />
          </OptionAvatar>
          <OptionContent>
            {label} <OptionDescription>({value})</OptionDescription>
          </OptionContent>
        </Option>
      )}
    />
  );
};

export default memo(MultiUsersSelectElement);
