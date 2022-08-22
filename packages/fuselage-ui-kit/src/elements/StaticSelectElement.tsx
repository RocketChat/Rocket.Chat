import { SelectFiltered } from '@rocket.chat/fuselage';
import type * as UiKit from '@rocket.chat/ui-kit';
import type { ReactElement } from 'react';
import React, { memo, useCallback, useMemo } from 'react';

import { useUiKitState } from '../hooks/useUiKitState';
import type { BlockProps } from '../utils/BlockProps';
import { fromTextObjectToString } from '../utils/fromTextObjectToString';

type StaticSelectElementProps = BlockProps<UiKit.StaticSelectElement>;

const StaticSelectElement = ({
  block,
  context,
  surfaceRenderer,
}: StaticSelectElementProps): ReactElement => {
  const [{ loading, value, error }, action] = useUiKitState(block, context);

  const options = useMemo<[string, string][]>(
    () =>
      block.options.map((option, i) => [
        option.value,
        fromTextObjectToString(surfaceRenderer, option.text, i) ?? '',
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
    <SelectFiltered
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

export default memo(StaticSelectElement);
