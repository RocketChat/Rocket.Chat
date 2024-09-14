import {
  Field,
  FieldLabel,
  FieldRow,
  FieldError,
  FieldHint,
} from '@rocket.chat/fuselage';
import * as UiKit from '@rocket.chat/ui-kit';
import type { ReactElement } from 'react';
import { memo, useMemo } from 'react';

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
        <FieldLabel>
          {surfaceRenderer.renderTextObject(
            block.label,
            0,
            UiKit.BlockContext.NONE
          )}
        </FieldLabel>
      )}
      <FieldRow>
        {surfaceRenderer.renderInputBlockElement(inputElement, 0)}
      </FieldRow>
      {error && <FieldError>{error}</FieldError>}
      {block.hint && (
        <FieldHint>
          {surfaceRenderer.renderTextObject(
            block.hint,
            0,
            UiKit.BlockContext.NONE
          )}
        </FieldHint>
      )}
    </Field>
  );
};

export default memo(InputBlock);
