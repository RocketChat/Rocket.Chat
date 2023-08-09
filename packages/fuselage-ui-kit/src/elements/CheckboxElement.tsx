import { CheckBox, Box } from '@rocket.chat/fuselage';
import * as UiKit from '@rocket.chat/ui-kit';
import type { ReactElement } from 'react';

import { useUiKitState } from '../hooks/useUiKitState';
import type { BlockProps } from '../utils/BlockProps';

type CheckboxElementProps = BlockProps<UiKit.CheckboxElement>;

const CheckboxElement = ({
  block,
  context,
  surfaceRenderer,
}: CheckboxElementProps): ReactElement => {
  const [{ loading, value }, action] = useUiKitState(block, context);
  const { options } = block;

  return (
    <Box>
      {options.map((option: UiKit.Option) => {
        const isChecked = value?.includes(option.value);

        return (
          <Box key={option.value} pb={4}>
            <CheckBox
              disabled={loading}
              value={option.value}
              checked={isChecked}
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

export default CheckboxElement;
