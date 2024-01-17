import { Draggable } from 'react-beautiful-dnd';

import RenderPayload from '../Preview/Display/RenderPayload/RenderPayload';
import type { Block } from './DraggableList';

export type DraggableListItemProps = {
  block: Block;
  surface: number;
  index: number;
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
        <RenderPayload
          surface={surface}
          payload={[block.payload]}
          index={index}
        />
      </div>
    )}
  </Draggable>
);

export default DraggableListItem;
