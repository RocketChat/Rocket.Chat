import { InputBox } from '@rocket.chat/fuselage';
import type * as UiKit from '@rocket.chat/ui-kit';
import type { ReactElement } from 'react';

import { useStringFromTextObject } from '../hooks/useStringFromTextObject';
import { useUiKitState } from '../hooks/useUiKitState';
import type { BlockProps } from '../utils/BlockProps';

type DatePickerElementProps = BlockProps<UiKit.DatePickerElement>;

const DatePickerElement = ({
  block,
  context,
}: DatePickerElementProps): ReactElement => {
  const [{ loading, value, error }, action] = useUiKitState(block, context);
  const { actionId, placeholder } = block;
  const fromTextObjectToString = useStringFromTextObject();

  return (
    <InputBox
      type='date'
      error={error}
      value={value as string}
      disabled={loading}
      id={actionId}
      name={actionId}
      rows={6}
      placeholder={fromTextObjectToString(placeholder)}
      onInput={action}
    />
  );
};

export default DatePickerElement;
