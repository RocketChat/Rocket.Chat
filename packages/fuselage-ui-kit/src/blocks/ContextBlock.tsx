import { Box } from '@rocket.chat/fuselage';
import type * as UiKit from '@rocket.chat/ui-kit';
import type { ReactElement } from 'react';
import { memo, useMemo } from 'react';

import Item from './ContextBlock.Item';
import type { BlockProps } from '../utils/BlockProps';

type ContextBlockProps = BlockProps<UiKit.ContextBlock>;

const ContextBlock = ({
  className,
  block,
  surfaceRenderer,
}: ContextBlockProps): ReactElement => {
  const itemElements = useMemo(
    () =>
      block.elements.map((element) => ({
        ...element,
        appId: block.appId,
        blockId: block.blockId,
      })),
    [block.appId, block.blockId, block.elements],
  );

  return (
    <Box className={className} display='flex' alignItems='center' margin={-4}>
      {itemElements.map((element, i) => (
        <Item
          key={i}
          block={element}
          surfaceRenderer={surfaceRenderer}
          index={i}
        />
      ))}
    </Box>
  );
};

export default memo(ContextBlock);
