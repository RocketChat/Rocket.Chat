import { Box } from '@rocket.chat/fuselage';
import { UiKitContext } from '@rocket.chat/fuselage-ui-kit';
import type { FC } from 'react';
import { useContext, useState, useEffect } from 'react';
import type { DropResult } from 'react-beautiful-dnd';

import {
  context,
  updatePayloadAction,
  actionPreviewAction,
} from '../../../../Context';
import generateActionPreview from '../../../../Payload/actionPreview/generateActionPreview';
import type { Block } from '../../../Draggable/DraggableList';
import DraggableList from '../../../Draggable/DraggableList';
import { reorder } from './Reorder';
import SurfaceRender from './SurfaceRender';
import { SurfaceOptions } from './constant';

const Surface: FC = () => {
  const {
    state: { screens, activeScreen, user },
    dispatch,
  } = useContext(context);
  const [uniqueBlocks, setUniqueBlocks] = useState<{
    block: Block[];
    isChangeByDnd: boolean;
  }>({
    block: screens[activeScreen]?.payload?.blocks?.map((block, i) => ({
      id: `${i}`,
      payload: block,
    })),
    isChangeByDnd: false,
  });
  const preview = generateActionPreview({
    type: 'Action Block',
    data: {},
    surface: screens[activeScreen]?.payload.surface,
    blocks: screens[activeScreen]?.payload.blocks,
    user: user,
  });
  useEffect(() => {
    setUniqueBlocks({
      block: screens[activeScreen]?.payload?.blocks?.map((block, i) => ({
        id: `${i}`,
        payload: block,
      })),
      isChangeByDnd: false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screens[activeScreen]?.payload.blocks]);

  useEffect(() => {
    if (uniqueBlocks.isChangeByDnd) {
      dispatch(
        updatePayloadAction({
          blocks: uniqueBlocks.block.map((block) => block.payload),
          changedByEditor: false,
        })
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uniqueBlocks]);

  const onDragEnd = ({ destination, source }: DropResult) => {
    if (!destination) return;

    const newBlocks = reorder(
      uniqueBlocks.block,
      source.index,
      destination.index
    );

    setUniqueBlocks({ block: newBlocks, isChangeByDnd: true });
  };

  return (
    <Box w="100%" h="100%" padding="20px">
      <UiKitContext.Provider
        value={{
          action: (a) => {
            preview.action = a;
            dispatch(actionPreviewAction({ ...preview }));
          },
          updateState: (s) => {
            preview.state = s;
            dispatch(actionPreviewAction({ ...preview }));
          },
          values: {},
          appId: 'core',
        }}
      >
        <SurfaceRender type={screens[activeScreen]?.payload.surface}>
          <DraggableList
            surface={SurfaceOptions.Modal}
            blocks={uniqueBlocks.block || []}
            onDragEnd={onDragEnd}
          />
        </SurfaceRender>
      </UiKitContext.Provider>
    </Box>
  );
};

export default Surface;
