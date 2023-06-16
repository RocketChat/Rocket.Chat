import { Throbber, ToastBar } from '@rocket.chat/fuselage';
import * as UiKit from '@rocket.chat/ui-kit';
import type { ReactElement } from 'react';

import { useUiKitState } from '../hooks/useUiKitState';
import type { BlockProps } from '../utils/BlockProps';

type ToastBarElementProps = BlockProps<UiKit.ToastBarElement>;

const ToastBarElement = ({
  block,
  context,
  index,
  surfaceRenderer,
}: ToastBarElementProps): ReactElement => {
  const [{ loading }] = useUiKitState(block, context);

  return (
    <ToastBar key={block.actionId || index}>
      {loading ? (
        <Throbber />
      ) : (
        surfaceRenderer.renderTextObject(block.text, 0, UiKit.BlockContext.NONE)
      )}
    </ToastBar>
  );
};

export default ToastBarElement;
