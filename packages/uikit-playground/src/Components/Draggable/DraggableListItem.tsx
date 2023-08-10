import * as React from 'react';
import { Draggable } from 'react-beautiful-dnd';

import DeleteElementBtn from '../Preview/Display/RenderPayload/DeleteElementBtn';
import ElementWrapper from '../Preview/Display/RenderPayload/ElementWrapper';
import RenderPayload from '../Preview/Display/RenderPayload/RenderPayload';
import type { Block } from './DraggableList';

export type DraggableListItemProps = {
  block: Block,
  surface: number,
  index: number,
};

const DraggableListItem = ({
  block,
  surface,
  index,
}: DraggableListItemProps) => (
  <Draggable draggableId={block.id} index={index}>
    {(provided) => (
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
      >
        <ElementWrapper key={index}>
          <DeleteElementBtn elementIndex={index} />
          <RenderPayload surface={surface} payload={[block.payload]} />
        </ElementWrapper>
      </div>
    )}
  </Draggable>
);

export default DraggableListItem;
