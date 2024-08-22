import { Box } from '@rocket.chat/fuselage';
import type * as UiKit from '@rocket.chat/ui-kit';
import { BlockContext, ElementType } from '@rocket.chat/ui-kit';

import type { BlockProps } from '../../utils/BlockProps';

type ContextElementProps = BlockProps<UiKit.ContextBlock>;

type ContextElementItemProps = {
  element: ContextElementProps['block']['elements'][number];
  surfaceRenderer: ContextElementProps['surfaceRenderer'];
  index: number;
};

export const ContextElementItem = ({
  element,
  surfaceRenderer,
  index,
}: ContextElementItemProps) => {
  const renderedElement = surfaceRenderer.renderContext(
    element,
    BlockContext.CONTEXT,
    undefined,
    index
  );

  if (!renderedElement) {
    return null;
  }

  switch (element.type) {
    case ElementType.PLAIN_TEXT:
    case ElementType.MARKDOWN:
      return (
        <Box is='span' withTruncatedText fontScale='c1' color='hint' margin={4}>
          {renderedElement}
        </Box>
      );

    default:
      return <>{renderedElement}</>;
  }
};
