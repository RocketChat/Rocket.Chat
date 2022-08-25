import { Box } from '@rocket.chat/fuselage';
import * as UiKit from '@rocket.chat/ui-kit';
import type { ReactElement } from 'react';
import React from 'react';

type ActionProps = {
  element: UiKit.ActionsBlock['elements'][number];
  parser: UiKit.SurfaceRenderer<ReactElement>;
  index: number;
};

const Action = ({
  element,
  parser,
  index,
}: ActionProps): ReactElement | null => {
  const renderedElement = parser.renderActionsBlockElement(element, index);

  if (!renderedElement) {
    return null;
  }

  return (
    <Box
      display='flex'
      margin={4}
      flexGrow={element.type !== UiKit.BlockElementType.BUTTON ? 1 : undefined}
      flexBasis={
        element.type !== UiKit.BlockElementType.BUTTON ? '45%' : undefined
      }
    >
      {renderedElement}
    </Box>
  );
};

export default Action;
