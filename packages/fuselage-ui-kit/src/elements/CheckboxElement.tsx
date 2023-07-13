import { CheckBox, Box } from '@rocket.chat/fuselage';
import * as UiKit from '@rocket.chat/ui-kit';
import { type ReactElement } from 'react';

import { useUiKitState } from '../hooks/useUiKitState';
import type { BlockProps } from '../utils/BlockProps';

type CheckboxElementProps = BlockProps<UiKit.CheckboxElement>;

const CheckboxElement = ({
  block,
  context,
  surfaceRenderer,
}: CheckboxElementProps): ReactElement => {
  const [{ loading }, action] = useUiKitState(block, context);
  const { options, initialOptions } = block;

  return (
    <>
      {options.map((option: UiKit.Option) => {
        const isChecked = initialOptions?.some(
          (initialOption) => initialOption.value === option.value
        );

        return (
          <Box key={option.value} pb='x4'>
            <CheckBox
              disabled={loading}
              value={option.value}
              checked={isChecked}
              onChange={action}
            />
            <Box is='label' pis='x8'>
              {surfaceRenderer.renderTextObject(
                option.text,
                0,
                UiKit.BlockContext.NONE
              )}
            </Box>
          </Box>
        );
      })}
    </>
  );
};

export default CheckboxElement;
