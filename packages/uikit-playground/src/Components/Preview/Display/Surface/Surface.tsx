import { Box } from '@rocket.chat/fuselage';
import { kitContext } from '@rocket.chat/fuselage-ui-kit';
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
    block: screens[activeScreen]?.payload.map((block, i) => ({
      id: `${i}`,
      payload: block,
    })),
    isChangeByDnd: false,
  });
  const preview = generateActionPreview({
    type: 'Action Block',
    data: {},
    surface: screens[activeScreen]?.surface,
    payload: screens[activeScreen]?.payload,
    user: user,
  });
  useEffect(() => {
    setUniqueBlocks({
      block: screens[activeScreen]?.payload.map((block, i) => ({
        id: `${i}`,
        payload: block,
      })),
      isChangeByDnd: false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screens[activeScreen]?.payload]);

  useEffect(() => {
    if (uniqueBlocks.isChangeByDnd) {
      dispatch(
        updatePayloadAction({
          payload: uniqueBlocks.block.map((block) => block.payload),
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
      <kitContext.Provider
        value={{
          action: (a) => {
            preview.action = a;
            dispatch(actionPreviewAction({ ...preview }));
          },
          state: (s) => {
            preview.state = s;
            dispatch(actionPreviewAction({ ...preview }));
          },
          values: {},
          appId: 'core',
        }}
      >
        <SurfaceRender type={screens[activeScreen]?.surface}>
          <DraggableList
            surface={SurfaceOptions.Modal}
            blocks={uniqueBlocks.block || []}
            onDragEnd={onDragEnd}
          />
        </SurfaceRender>
      </kitContext.Provider>
    </Box>
  );
};

export default Surface;
