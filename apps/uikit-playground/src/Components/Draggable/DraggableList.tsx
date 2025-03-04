import { memo } from 'react';
import type { OnDragEndResponder } from '@hello-pangea/dnd';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';

import DraggableListItem from './DraggableListItem';
import { SurfaceOptions } from '../Preview/Display/Surface/constant';
import { ILayoutBlock } from '../../Context/initialState';

export type Block = {
  id: string;
  payload: ILayoutBlock;
};

export type DraggableListProps = {
  blocks: Block[];
  surface?: SurfaceOptions;
  onDragEnd: OnDragEndResponder;
};

const DraggableList = memo(
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
