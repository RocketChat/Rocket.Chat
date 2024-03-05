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
import { useEndpoint } from '@rocket.chat/ui-contexts';
import type * as UiKit from '@rocket.chat/ui-kit';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { memo, useCallback, useState } from 'react';

import { useUiKitState } from '../../hooks/useUiKitState';
import type { BlockProps } from '../../utils/BlockProps';

type MultiUsersSelectElementProps = BlockProps<UiKit.MultiUsersSelectElement>;

type MultiUserSelectOptionType = {
  label: string;
  value: string;
};

const MultiUsersSelectElement = ({
  block,
  context,
}: MultiUsersSelectElementProps): ReactElement => {
  const [{ loading, value }, action] = useUiKitState(block, context);
  const [filter, setFilter] = useState('');

  const debouncedFilter = useDebouncedValue(filter, 500);
  const getUsers = useEndpoint('GET', '/v1/users.autocomplete');

  const { data } = useQuery(
    ['users.autocomplete', debouncedFilter],
    async () => {
      const users = await getUsers({
        selector: JSON.stringify({ term: debouncedFilter }),
      });
      const options = users.items.map((item): MultiUserSelectOptionType => {
        return { value: item.username, label: item.name || item.username };
      });

      return options;
    },
    { keepPreviousData: true }
  );

  const handleChange = useCallback(
    (value) => {
      action({ target: { value } });
    },
    [action]
  );

  return (
    <AutoComplete
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
        <Option data-qa-type='autocomplete-user-option' key={value} {...props}>
          <OptionAvatar>
            <UserAvatar username={value} size='x20' />
          </OptionAvatar>
          <OptionContent>
            {label} <OptionDescription>({value})</OptionDescription>
          </OptionContent>
        </Option>
      )}
      options={data || []}
      value={value as MultiUserSelectOptionType['value']}
    />
  );
};

export default memo(MultiUsersSelectElement);
