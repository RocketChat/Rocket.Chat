import { Field } from '@rocket.chat/fuselage';
import * as UiKit from '@rocket.chat/ui-kit';
import type { ReactElement } from 'react';
import React, { memo, useMemo } from 'react';

import { useUiKitState } from '../hooks/useUiKitState';
import type { BlockProps } from '../utils/BlockProps';

type InputBlockProps = BlockProps<UiKit.InputBlock>;

const InputBlock = ({
  className,
  block,
  surfaceRenderer,
  context,
}: InputBlockProps): ReactElement => {
  const inputElement = useMemo(
    () => ({
      ...block.element,
      appId: block.element.appId ?? block.appId,
      blockId: block.element.blockId ?? block.blockId,
    }),
    [block.element, block.appId, block.blockId]
  );

  const [{ error }] = useUiKitState(inputElement, context);

  return (
    <Field className={className}>
      {block.label && (
        <Field.Label>
          {surfaceRenderer.renderTextObject(
            block.label,
            0,
            UiKit.BlockContext.NONE
          )}
        </Field.Label>
      )}
      <Field.Row>
        {surfaceRenderer.renderInputBlockElement(inputElement, 0)}
      </Field.Row>
      {error && <Field.Error>{error}</Field.Error>}
      {block.hint && <Field.Hint>{block.hint}</Field.Hint>}
    </Field>
  );
};

export default memo(InputBlock);
