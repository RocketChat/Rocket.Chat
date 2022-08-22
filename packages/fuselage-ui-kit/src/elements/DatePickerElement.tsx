import { InputBox } from '@rocket.chat/fuselage';
import type * as UiKit from '@rocket.chat/ui-kit';
import type { ReactElement } from 'react';
import React from 'react';

import { useUiKitState } from '../hooks/useUiKitState';
import type { BlockProps } from '../utils/BlockProps';
import { fromTextObjectToString } from '../utils/fromTextObjectToString';

type DatePickerElementProps = BlockProps<UiKit.DatePickerElement>;

const DatePickerElement = ({
  block,
  context,
  surfaceRenderer,
}: DatePickerElementProps): ReactElement => {
  const [{ loading, value, error }, action] = useUiKitState(block, context);
  const { actionId, placeholder } = block;

  return (
    <InputBox
      type='date'
      error={error}
      value={value as string}
      disabled={loading}
      id={actionId}
      name={actionId}
      rows={6}
      placeholder={
        placeholder
          ? fromTextObjectToString(surfaceRenderer, placeholder, 0)
          : undefined
      }
      onInput={action}
    />
  );
};

export default DatePickerElement;
