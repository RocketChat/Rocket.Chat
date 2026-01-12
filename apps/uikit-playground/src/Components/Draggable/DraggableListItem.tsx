import { Draggable } from '@hello-pangea/dnd';

import DeleteElementBtn from '../Preview/Display/UiKitElementWrapper/DeleteElementBtn';
import UiKitElementWrapper from '../Preview/Display/UiKitElementWrapper/UiKitElementWrapper';
import RenderPayload from '../RenderPayload/RenderPayload';
import { SurfaceOptions } from '../Preview/Display/Surface/constant';
import type { Block } from './DraggableList';

export type DraggableListItemProps = {
  block: Block;
  surface: SurfaceOptions;
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
        <UiKitElementWrapper key={index}>
          <DeleteElementBtn elementIndex={index} />
          <RenderPayload surface={surface} blocks={[block.payload]} />
        </UiKitElementWrapper>
      </div>
    )}
  </Draggable>
);

export default DraggableListItem;
