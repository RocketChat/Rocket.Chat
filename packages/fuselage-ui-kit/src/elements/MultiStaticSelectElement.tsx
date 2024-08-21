import type { SelectOption } from '@rocket.chat/fuselage';
import { MultiSelectFiltered } from '@rocket.chat/fuselage';
import type * as UiKit from '@rocket.chat/ui-kit';
import type { ReactElement } from 'react';
import { memo, useCallback, useMemo } from 'react';

import { useStringFromTextObject } from '../hooks/useStringFromTextObject';
import { useUiKitState } from '../hooks/useUiKitState';
import type { BlockProps } from '../utils/BlockProps';

type MultiStaticSelectElementProps = BlockProps<UiKit.MultiStaticSelectElement>;

const MultiStaticSelectElement = ({
  block,
  context,
}: MultiStaticSelectElementProps): ReactElement => {
  const [{ loading, value, error }, action] = useUiKitState(block, context);
  const fromTextObjectToString = useStringFromTextObject();

  const options = useMemo<SelectOption[]>(
    () =>
      block.options.map(({ value, text }) => [
        value,
        fromTextObjectToString(text) ?? '',
      ]),
    [block.options, fromTextObjectToString]
  );

  const handleChange = useCallback(
    (value: string[]) => {
      action({ target: { value } });
    },
    [action]
  );

  return (
    <MultiSelectFiltered
      value={value}
      disabled={loading}
      error={error}
      options={options}
      placeholder={fromTextObjectToString(block.placeholder)}
      onChange={handleChange}
    />
  );
};

export default memo(MultiStaticSelectElement);
