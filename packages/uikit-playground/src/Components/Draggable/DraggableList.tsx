import type { LayoutBlock } from '@rocket.chat/ui-kit';
import React from 'react';
import type { OnDragEndResponder } from 'react-beautiful-dnd';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';

import DraggableListItem from './DraggableListItem';
import { SurfaceOptions } from '../Preview/Display/Surface/constant';

export type Block = {
  id: string;
  payload: LayoutBlock;
};

export type DraggableListProps = {
  blocks: Block[];
  surface?: SurfaceOptions;
  onDragEnd: OnDragEndResponder;
};

const DraggableList = React.memo(
  ({ blocks, surface, onDragEnd }: DraggableListProps) => (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="droppable-list">
        {(provided) => (
          <div
            style={{ padding: '10px' }}
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {blocks.map((block, index) => (
              <DraggableListItem
                surface={surface || SurfaceOptions.Message}
                block={block}
                index={index}
                key={block.id}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  )
);

export default DraggableList;
