import { CheckBox, Box } from '@rocket.chat/fuselage';
import * as UiKit from '@rocket.chat/ui-kit';
import { useCallback, type ReactElement } from 'react';

import { useUiKitState } from '../hooks/useUiKitState';
import type { BlockProps } from '../utils/BlockProps';

type CheckboxElementProps = BlockProps<UiKit.CheckboxElement>;

const CheckboxElement = ({
  block,
  context,
  surfaceRenderer,
}: CheckboxElementProps): ReactElement => {
  const [{ loading, value }, action] = useUiKitState(block, context);
  const { options, initialOptions } = block;

  const handleChange = useCallback(
    (value) => {
      action({ target: { value } });
    },
    [action]
  );

  return (
    <Box>
      {options.map((option: UiKit.Option) => {
        const isChecked = initialOptions?.some(
          (initialOption) => initialOption.value === option.value
        );

        return (
          <Box key={option.value} pb='x4'>
            <CheckBox
              disabled={loading}
              value={value}
              checked={isChecked}
              onChange={handleChange}
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

export default CheckboxElement;
