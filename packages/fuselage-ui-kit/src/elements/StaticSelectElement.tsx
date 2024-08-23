import { SelectFiltered } from '@rocket.chat/fuselage';
import type * as UiKit from '@rocket.chat/ui-kit';
import type { ReactElement } from 'react';
import { memo, useCallback, useMemo } from 'react';

import { useStringFromTextObject } from '../hooks/useStringFromTextObject';
import { useUiKitState } from '../hooks/useUiKitState';
import type { BlockProps } from '../utils/BlockProps';

type StaticSelectElementProps = BlockProps<UiKit.StaticSelectElement>;

const StaticSelectElement = ({
  block,
  context,
}: StaticSelectElementProps): ReactElement => {
  const [{ loading, value, error }, action] = useUiKitState(block, context);
  const fromTextObjectToString = useStringFromTextObject();

  const options = useMemo<[string, string][]>(
    () =>
      block.options.map((option) => [
        option.value,
        fromTextObjectToString(option.text) ?? '',
      ]),
    [block.options, fromTextObjectToString]
  );

  const handleChange = useCallback(
    (value: string) => {
      action({ target: { value } });
    },
    [action]
  );

  return (
    <SelectFiltered
      value={value}
      disabled={loading}
      error={error}
      options={options}
      placeholder={fromTextObjectToString(block.placeholder)}
      onChange={handleChange}
    />
  );
};

export default memo(StaticSelectElement);
