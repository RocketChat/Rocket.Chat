import type { SelectOption } from '@rocket.chat/fuselage';
import { MultiSelectFiltered } from '@rocket.chat/fuselage';
import type * as UiKit from '@rocket.chat/ui-kit';
import type { ReactElement } from 'react';
import React, { memo, useCallback, useMemo } from 'react';

import { useUiKitState } from '../hooks/useUiKitState';
import type { BlockProps } from '../utils/BlockProps';
import { fromTextObjectToString } from '../utils/fromTextObjectToString';

type MultiStaticSelectElementProps = BlockProps<UiKit.MultiStaticSelectElement>;

const MultiStaticSelectElement = ({
  block,
  context,
  surfaceRenderer,
}: MultiStaticSelectElementProps): ReactElement => {
  const [{ loading, value, error }, action] = useUiKitState(block, context);

  const options = useMemo<SelectOption[]>(
    () =>
      block.options.map(({ value, text }, i) => [
        value,
        fromTextObjectToString(surfaceRenderer, text, i) ?? '',
      ]),
    [block.options, surfaceRenderer]
  );

  const handleChange = useCallback(
    (value) => {
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
      placeholder={fromTextObjectToString(
        surfaceRenderer,
        block.placeholder,
        0
      )}
      onChange={handleChange}
    />
  );
};

export default memo(MultiStaticSelectElement);
