import { Callout, Throbber } from '@rocket.chat/fuselage';
import * as UiKit from '@rocket.chat/ui-kit';
import type { ReactElement } from 'react';

import { useUiKitState } from '../hooks/useUiKitState';
import type { BlockProps } from '../utils/BlockProps';

type CalloutElementProps = BlockProps<UiKit.CalloutElement>;

const CalloutElement = ({
  block,
  context,
  index,
  surfaceRenderer,
}: CalloutElementProps): ReactElement => {
  const [{ loading }, action] = useUiKitState(block, context);

  return (
    <Callout
      disabled={loading}
      key={block.actionId || index}
      title={block.title.text}
      onChange={action}
      type={block.variant}
    >
      {loading ? (
        <Throbber />
      ) : (
        surfaceRenderer.renderTextObject(block.text, 0, UiKit.BlockContext.NONE)
      )}
    </Callout>
  );
};

export default CalloutElement;
