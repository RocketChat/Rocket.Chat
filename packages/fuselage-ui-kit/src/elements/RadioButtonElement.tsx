import { Box, RadioButton } from '@rocket.chat/fuselage';
import * as UiKit from '@rocket.chat/ui-kit';
import { useCallback, type ReactElement } from 'react';

import { useUiKitState } from '../hooks/useUiKitState';
import type { BlockProps } from '../utils/BlockProps';

type RadioButtonElementProps = BlockProps<UiKit.RadioButtonElement>;

const RadioButtonElement = ({
  block,
  context,
  surfaceRenderer,
}: RadioButtonElementProps): ReactElement => {
  const [{ loading, value }, action] = useUiKitState(block, context);
  const { options, initialOption } = block;

  const handleChange = useCallback(
    (selectedValue) => {
      action({ target: { value: selectedValue } });
    },
    [action]
  );

  return (
    <Box>
      {options.map((option: UiKit.Option) => {
        return (
          <Box key={option.value} pb='x4'>
            <RadioButton
              disabled={loading}
              checked={option.value === initialOption?.value}
              value={value}
              onChange={() => handleChange(option.value)}
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
    </Box>
  );
};

export default RadioButtonElement;
