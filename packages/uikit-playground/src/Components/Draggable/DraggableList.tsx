import type { LayoutBlock } from '@rocket.chat/ui-kit';
import * as React from 'react';
import type { OnDragEndResponder } from 'react-beautiful-dnd';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';

import DraggableListItem from './DraggableListItem';

export type Block = {
  id: string;
  payload: LayoutBlock;
};

export type DraggableListProps = {
  blocks: Block[];
  surface?: number;
  onDragEnd: OnDragEndResponder;
};

const DraggableList = React.memo(
  ({ blocks, surface, onDragEnd }: DraggableListProps) => (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <>
          <Droppable droppableId='droppable-list'>
            {(provided) => (
              <div
                style={{ padding: '10px' }}
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                <>
                  {blocks.map((block, index) => (
                    <DraggableListItem
                      surface={surface || 1}
                      block={block}
                      index={index}
                      key={block.id}
                    />
                  ))}
                  {provided.placeholder}
                </>
              </div>
            )}
          </Droppable>
        </>
      </DragDropContext>
    </>
  )
);

export default DraggableList;
