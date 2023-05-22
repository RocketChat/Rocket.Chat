import { Box } from '@rocket.chat/fuselage';
import type { FC } from 'react';
import React, { useContext, useState, useEffect } from 'react';
import type { DropResult } from 'react-beautiful-dnd';

import { context, docAction } from '../../../../Context';
import type { Block } from '../../../Draggable/DraggableList';
import BannerSurface from './BannerSurface';
import MessageSurface from './MessageSurface';
import ModalSurface from './ModalSurface';
import { reorder } from './Reorder';

const Surface: FC = () => {
  const {
    state: {
      doc: { payload },
      surface,
    },
    dispatch,
  } = useContext(context);
  const [uniqueBlocks, setUniqueBlocks] = useState<Block[]>(
    payload.map((block, i) => ({ id: `${i}`, payload: block }))
  );

  useEffect(() => {
    console.log(payload);
    setUniqueBlocks(
      payload.map((block, i) => ({ id: `${i}`, payload: block }))
    );
  }, [payload.length]);

  useEffect(() => {
    dispatch(
      docAction({
        payload: uniqueBlocks.map((block) => block.payload),
        changedByEditor: false,
      })
    );
  }, [uniqueBlocks]);

  const onDragEnd = ({ destination, source }: DropResult) => {
    if (!destination) return;

    const newBlocks = reorder(uniqueBlocks, source.index, destination.index);

    setUniqueBlocks(newBlocks);
  };

  const surfaceRender: { [key: number]: any } = {
    '1': () => <MessageSurface blocks={uniqueBlocks} onDragEnd={onDragEnd} />,
    '2': () => <BannerSurface blocks={uniqueBlocks} onDragEnd={onDragEnd} />,
    '3': () => <ModalSurface blocks={uniqueBlocks} onDragEnd={onDragEnd} />,
  };
  return (
    <Box pb='40px' pi='x20'>
      {surfaceRender[surface]()}
    </Box>
  );
};

export default Surface;
