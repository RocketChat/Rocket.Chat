import { RadioButton } from '@rocket.chat/fuselage';
import type * as UiKit from '@rocket.chat/ui-kit';
import type { ReactElement } from 'react';

import { useUiKitState } from '../hooks/useUiKitState';
import type { BlockProps } from '../utils/BlockProps';

type RadioButtonElementProps = BlockProps<UiKit.RadioButtonElement>;

const RadioButtonElement = ({
  block,
  context,
  index,
}: RadioButtonElementProps): ReactElement => {
  const [{ loading }, action] = useUiKitState(block, context);

  return (
    <RadioButton
      disabled={loading}
      key={block.actionId || index}
      checked={block.value}
      onChange={action}
    />
  );
};

export default RadioButtonElement;
