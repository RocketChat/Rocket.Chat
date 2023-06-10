import { Banner, Icon } from '@rocket.chat/fuselage';
import React from 'react';

import DraggableList from '../../../Draggable/DraggableList';
import type { DraggableListProps } from '../../../Draggable/DraggableList';
import { SurfaceOptions } from './constant';

const MessageSurface = ({ blocks, onDragEnd }: DraggableListProps) => (
  <Banner icon={<Icon name="info" size="x20" />}>
    <DraggableList
      surface={SurfaceOptions.Banner}
      blocks={blocks}
      onDragEnd={onDragEnd}
    />
  </Banner>
);

export default MessageSurface;
