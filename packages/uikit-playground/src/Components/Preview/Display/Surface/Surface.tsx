import { Box } from '@rocket.chat/fuselage';
import type { FC } from 'react';
import { useContext, useState, useEffect } from 'react';
import type { DropResult } from 'react-beautiful-dnd';

import { context } from '../../../../Context';
import type { Block } from '../../../Draggable/DraggableList';
import BannerSurface from './BannerSurface';
import MessageSurface from './MessageSurface';
import ModalSurface from './ModalSurface';
import ContextualBarSurface from './ContextualBarSurface';
import { reorder } from './Reorder';

const Surface: FC = () => {
	const {
		state: {
			doc: { payload },
			surface,
		},
	} = useContext(context);
	const [uniqueBlocks, setUniqueBlocks] = useState<Block[]>(payload.map((block, i) => ({ id: `${i}`, payload: block })));

	useEffect(() => {
		setUniqueBlocks(payload.map((block, i) => ({ id: `${i}`, payload: block })));
	}, [payload]);

	const onDragEnd = ({ destination, source }: DropResult) => {
		if (!destination) return;

		const newBlocks = reorder(uniqueBlocks, source.index, destination.index);

		setUniqueBlocks(newBlocks);
	};

	const surfaceRender: { [key: number]: () => JSX.Element } = {
		'1': () => <MessageSurface blocks={uniqueBlocks} onDragEnd={onDragEnd} />,
		'2': () => <BannerSurface blocks={uniqueBlocks} onDragEnd={onDragEnd} />,
		'3': () => <ModalSurface blocks={uniqueBlocks} onDragEnd={onDragEnd} />,
		'4': () => <ContextualBarSurface blocks={uniqueBlocks} onDragEnd={onDragEnd} />,
	};
	return (
		<Box pb='40px' pi={20}>
			{surfaceRender[surface]()}
		</Box>
	);
};

export default Surface;
