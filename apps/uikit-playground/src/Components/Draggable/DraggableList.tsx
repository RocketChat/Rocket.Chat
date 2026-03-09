import type { OnDragEndResponder } from '@hello-pangea/dnd';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { memo } from 'react';

import DraggableListItem from './DraggableListItem';
import type { ILayoutBlock } from '../../Context/initialState';
import { SurfaceOptions } from '../Preview/Display/Surface/constant';

export type Block = {
	id: string;
	payload: ILayoutBlock;
};

export type DraggableListProps = {
	blocks: Block[];
	surface?: SurfaceOptions;
	onDragEnd: OnDragEndResponder;
};

const DraggableList = ({ blocks, surface, onDragEnd }: DraggableListProps) => (
	<DragDropContext onDragEnd={onDragEnd}>
		<Droppable droppableId='droppable-list'>
			{(provided) => (
				<div style={{ padding: '10px' }} ref={provided.innerRef} {...provided.droppableProps}>
					{blocks.map((block, index) => (
						<DraggableListItem surface={surface || SurfaceOptions.Message} block={block} index={index} key={block.id} />
					))}
					{provided.placeholder}
				</div>
			)}
		</Droppable>
	</DragDropContext>
);

export default memo(DraggableList);
