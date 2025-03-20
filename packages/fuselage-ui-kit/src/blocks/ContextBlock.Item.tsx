import { Box } from '@rocket.chat/fuselage';
import * as UiKit from '@rocket.chat/ui-kit';
import type { ReactElement } from 'react';

type ItemProps = {
  block: UiKit.ContextBlock['elements'][number];
  surfaceRenderer: UiKit.SurfaceRenderer<ReactElement>;
  index: number;
};

const Item = ({
  block: element,
  surfaceRenderer: parser,
  index,
}: ItemProps): ReactElement | null => {
  const renderedElement = parser.renderContextBlockElement(element, index);

  if (!renderedElement) {
    return null;
  }

  switch (element.type) {
    case UiKit.TextObjectType.PLAIN_TEXT:
    case UiKit.TextObjectType.MARKDOWN:
      return (
        <Box is='span' fontScale='c1' color='hint' margin={4}>
          {renderedElement}
        </Box>
      );

    default:
      return renderedElement;
  }
};

export default Item;
