import { Callout } from '@rocket.chat/fuselage';
import * as UiKit from '@rocket.chat/ui-kit';
import type { ReactElement } from 'react';

import type { BlockProps } from '../utils/BlockProps';

type CalloutBlockProps = BlockProps<UiKit.CalloutBlock>;

const CalloutBlock = ({
  block,
  surfaceRenderer,
}: CalloutBlockProps): ReactElement => {
  return (
    <Callout
      title={block.title.text}
      type={block.variant}
    >
      {surfaceRenderer.renderTextObject(block.text, 0, UiKit.BlockContext.NONE)}
    </Callout>
  );
};

export default CalloutBlock;
