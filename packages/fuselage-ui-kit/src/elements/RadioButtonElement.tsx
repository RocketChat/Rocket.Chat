import { Box, RadioButton } from '@rocket.chat/fuselage';
import * as UiKit from '@rocket.chat/ui-kit';
import type { ReactElement } from 'react';

import { useUiKitState } from '../hooks/useUiKitState';
import type { BlockProps } from '../utils/BlockProps';

type RadioButtonElementProps = BlockProps<UiKit.RadioButtonElement>;

const RadioButtonElement = ({
  block,
  context,
  surfaceRenderer,
}: RadioButtonElementProps): ReactElement => {
  const [{ loading, value }, action] = useUiKitState(block, context);
  const { options } = block;

  return (
    <Box>
      {options.map((option: UiKit.Option) => {
        return (
          <Box key={option.value} pb={4}>
            <RadioButton
              disabled={loading}
              checked={value === option.value}
              value={option.value}
              onChange={action}
            />
            <Box is='label' pis={8}>
              {surfaceRenderer.renderTextObject(
                option.text,
                0,
                UiKit.BlockContext.NONE
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

export default RadioButtonElement;
