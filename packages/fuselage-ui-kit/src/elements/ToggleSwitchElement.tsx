import { ToggleSwitch } from '@rocket.chat/fuselage';
import type * as UiKit from '@rocket.chat/ui-kit';
import type { ReactElement } from 'react';

import { useUiKitState } from '../hooks/useUiKitState';
import type { BlockProps } from '../utils/BlockProps';

type ToggleSwitchElementProps = BlockProps<UiKit.ToggleSwitchElement>;

const ToggleSwitchElement = ({
  block,
  context,
  index,
}: ToggleSwitchElementProps): ReactElement => {
  const [{ loading }, action] = useUiKitState(block, context);

  return (
    <ToggleSwitch
      disabled={loading}
      key={block.actionId || index}
      checked={block.value}
      onChange={action}
    />
  );
};

export default ToggleSwitchElement;
