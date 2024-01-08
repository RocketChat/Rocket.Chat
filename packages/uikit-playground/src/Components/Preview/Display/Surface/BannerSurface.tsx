import { Banner, Icon } from '@rocket.chat/fuselage';

import DraggableList from '../../../Draggable/DraggableList';
import type { DraggableListProps } from '../../../Draggable/DraggableList';

const MessageSurface = ({ blocks, onDragEnd }: DraggableListProps) => (
  <Banner icon={<Icon name='info' size='x20' />}>
    <DraggableList surface={2} blocks={blocks} onDragEnd={onDragEnd} />
  </Banner>
);

export default MessageSurface;
