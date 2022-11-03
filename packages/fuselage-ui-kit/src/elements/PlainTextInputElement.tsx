import { TextAreaInput, TextInput } from '@rocket.chat/fuselage';
import type * as UiKit from '@rocket.chat/ui-kit';
import type { ReactElement } from 'react';
import React, { memo } from 'react';

import { useUiKitState } from '../hooks/useUiKitState';
import type { BlockProps } from '../utils/BlockProps';
import { fromTextObjectToString } from '../utils/fromTextObjectToString';

type PlainTextInputElementProps = BlockProps<UiKit.PlainTextInputElement>;

const PlainTextInputElement = ({
  block,
  context,
  surfaceRenderer,
}: PlainTextInputElementProps): ReactElement => {
  const [{ loading, value, error }, action] = useUiKitState(block, context);

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
        placeholder={
          block.placeholder
            ? fromTextObjectToString(surfaceRenderer, block.placeholder, 0)
            : undefined
        }
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
      placeholder={
        block.placeholder
          ? fromTextObjectToString(surfaceRenderer, block.placeholder, 0)
          : undefined
      }
    />
  );
};

export default memo(PlainTextInputElement);
