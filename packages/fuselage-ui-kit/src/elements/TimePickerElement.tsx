import { InputBox } from '@rocket.chat/fuselage';
import type * as UiKit from '@rocket.chat/ui-kit';
import type { ReactElement } from 'react';

import { useStringFromTextObject } from '../hooks/useStringFromTextObject';
import { useUiKitState } from '../hooks/useUiKitState';
import type { BlockProps } from '../utils/BlockProps';

type TimePickerElementProps = BlockProps<UiKit.TimePickerElement>;

const TimePickerElement = ({
  block,
  context,
}: TimePickerElementProps): ReactElement => {
  const [{ loading, value, error }, action] = useUiKitState(block, context);
  const { actionId, placeholder } = block;
  const fromTextObjectToString = useStringFromTextObject();

  return (
    <InputBox
      type='time'
      error={error}
      value={value}
      disabled={loading}
      id={actionId}
      name={actionId}
      rows={6}
      placeholder={fromTextObjectToString(placeholder)}
      onInput={action}
    />
  );
};

export default TimePickerElement;
