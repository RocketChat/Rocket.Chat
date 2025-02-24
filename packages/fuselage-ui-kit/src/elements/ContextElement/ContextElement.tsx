import { Box } from '@rocket.chat/fuselage';
import type * as UiKit from '@rocket.chat/ui-kit';

import { ContextElementItem } from './ContextElementItem';
import type { BlockProps } from '../../utils/BlockProps';

type ContextElementProps = BlockProps<UiKit.ContextBlock>;

export const ContextElement = ({
  block,
  surfaceRenderer,
  className,
}: ContextElementProps) => (
  <Box
    className={className}
    display='flex'
    alignItems='center'
    margin={-4}
    withTruncatedText
  >
    {block.elements.map((element, i) => (
      <ContextElementItem
        index={i}
        key={i}
        element={element}
        surfaceRenderer={surfaceRenderer}
      />
    ))}
  </Box>
);
