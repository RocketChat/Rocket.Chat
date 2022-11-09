import { Box, Button } from '@rocket.chat/fuselage';
import * as UiKit from '@rocket.chat/ui-kit';
import type { ReactElement } from 'react';
import React, { memo, useCallback, useMemo, useState } from 'react';

import { useSurfaceType } from '../contexts/SurfaceContext';
import type { BlockProps } from '../utils/BlockProps';
import Action from './ActionsBlock.Action';

type ActionsBlockProps = BlockProps<UiKit.ActionsBlock>;

const ActionsBlock = ({
  className,
  block,
  surfaceRenderer,
}: ActionsBlockProps): ReactElement => {
  const surfaceType = useSurfaceType();

  const [showMoreVisible, setShowMoreVisible] = useState(
    () => block.elements.length > 5 && surfaceType !== 'banner'
  );

  const handleShowMoreClick = useCallback(() => {
    setShowMoreVisible(false);
  }, []);

  const actionElements = useMemo(
    () =>
      (showMoreVisible ? block.elements.slice(0, 5) : block.elements).map(
        (element) => ({
          ...element,
          appId: element.appId ?? block.appId,
          blockId: element.blockId ?? block.blockId,
        })
      ),
    [block.appId, block.blockId, block.elements, showMoreVisible]
  );

  return (
    <Box className={className} display='flex' flexWrap='wrap' margin={-4}>
      {actionElements.map((element, i) => (
        <Action key={i} element={element} parser={surfaceRenderer} index={i} />
      ))}
      {showMoreVisible && (
        <Box display='flex' margin={4}>
          <Button small onClick={handleShowMoreClick}>
            {surfaceRenderer.renderTextObject(
              { type: 'plain_text', text: 'Show more...' },
              0,
              UiKit.BlockContext.NONE
            )}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default memo(ActionsBlock);
