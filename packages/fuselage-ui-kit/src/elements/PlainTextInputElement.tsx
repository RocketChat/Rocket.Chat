import { TextAreaInput, TextInput } from '@rocket.chat/fuselage';
import type * as UiKit from '@rocket.chat/ui-kit';
import type { ReactElement } from 'react';
import { memo } from 'react';

import { useStringFromTextObject } from '../hooks/useStringFromTextObject';
import { useUiKitState } from '../hooks/useUiKitState';
import type { BlockProps } from '../utils/BlockProps';

type PlainTextInputElementProps = BlockProps<UiKit.PlainTextInputElement>;

const PlainTextInputElement = ({
  block,
  context,
}: PlainTextInputElementProps): ReactElement => {
  const [{ loading, value, error }, action] = useUiKitState(block, context);
  const fromTextObjectToString = useStringFromTextObject();

  if (block.multiline) {
    return (
      <TextAreaInput
        disabled={loading}
        id={block.actionId}
        name={block.actionId}
        rows={6}
        error={error}
        value={value}
        onChange={action}
        placeholder={fromTextObjectToString(block.placeholder)}
      />
    );
  }

  return (
    <TextInput
      disabled={loading}
      id={block.actionId}
      name={block.actionId}
      error={error}
      value={value}
      onChange={action}
      placeholder={fromTextObjectToString(block.placeholder)}
    />
  );
};

export default memo(PlainTextInputElement);
