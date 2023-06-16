import { CheckBox } from '@rocket.chat/fuselage';
import type * as UiKit from '@rocket.chat/ui-kit';
import type { ReactElement } from 'react';

import { useUiKitState } from '../hooks/useUiKitState';
import type { BlockProps } from '../utils/BlockProps';

type CheckboxElementProps = BlockProps<UiKit.CheckboxElement>;

const CheckboxElement = ({
  block,
  context,
  index,
}: CheckboxElementProps): ReactElement => {
  const [{ loading }, action] = useUiKitState(block, context);

  return (
    <CheckBox
      disabled={loading}
      key={block.actionId || index}
      checked={block.value}
      onChange={action}
    />
  );
};

export default CheckboxElement;
