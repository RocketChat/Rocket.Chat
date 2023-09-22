import { InputBox } from '@rocket.chat/fuselage';
import type * as UiKit from '@rocket.chat/ui-kit';
import type { ReactElement } from 'react';

import { useUiKitState } from '../hooks/useUiKitState';
import type { BlockProps } from '../utils/BlockProps';
import { fromTextObjectToString } from '../utils/fromTextObjectToString';

type TimePickerElementProps = BlockProps<UiKit.TimePickerElement>;

const TimePickerElement = ({
  block,
  context,
  surfaceRenderer,
}: TimePickerElementProps): ReactElement => {
  const [{ loading, value, error }, action] = useUiKitState(block, context);
  const { actionId, placeholder } = block;

  return (
    <InputBox
      type='time'
      error={error}
      value={value}
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

export default TimePickerElement;
