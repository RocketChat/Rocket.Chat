import { Box } from '@rocket.chat/fuselage';
import { UiKitContext } from '@rocket.chat/fuselage-ui-kit';
import type { FC } from 'react';
import React, { useContext, useState, useEffect } from 'react';
import type { DropResult } from 'react-beautiful-dnd';

import { context, docAction, actionPreviewAction } from '../../../../Context';
import generateActionPreview from '../../../../Payload/actionPreview/generateActionPreview';
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
		dispatch,
	} = useContext(context);
	const [uniqueBlocks, setUniqueBlocks] = useState<{
		block: Block[];
		isChangeByDnd: boolean;
	}>({
		block: payload.map((block, i) => ({ id: `${i}`, payload: block })),
		isChangeByDnd: false,
	});
	const preview = generateActionPreview('Action Block', {});
	useEffect(() => {
		setUniqueBlocks({
			block: payload.map((block, i) => ({ id: `${i}`, payload: block })),
			isChangeByDnd: false,
		});
	}, [payload]);

	useEffect(() => {
		if (uniqueBlocks.isChangeByDnd) {
			dispatch(
				docAction({
					payload: uniqueBlocks.block.map((block) => block.payload),
					changedByEditor: false,
				}),
			);
		}
	}, [uniqueBlocks]);

	const onDragEnd = ({ destination, source }: DropResult) => {
		if (!destination) return;

		const newBlocks = reorder(uniqueBlocks.block, source.index, destination.index);

		setUniqueBlocks({ block: newBlocks, isChangeByDnd: true });
	};

	const surfaceRender: { [key: number]: any } = {
		'1': () => <MessageSurface blocks={uniqueBlocks.block} onDragEnd={onDragEnd} />,
		'2': () => <BannerSurface blocks={uniqueBlocks.block} onDragEnd={onDragEnd} />,
		'3': () => <ModalSurface blocks={uniqueBlocks.block} onDragEnd={onDragEnd} />,
		'4': () => <ContextualBarSurface blocks={uniqueBlocks} onDragEnd={onDragEnd} />,
	};
	return (
		<Box padding='20px'>
			<UiKitContext.Provider
				value={{
					action: (a) => {
						preview.action = a;
						dispatch(actionPreviewAction({ ...preview }));
					},
					state: (s) => {
						preview.state = s;
						dispatch(actionPreviewAction({ ...preview }));
					},
					values: {},
					appId: 'core',
				}}
			>
				{surfaceRender[surface]()}{' '}
			</UiKitContext.Provider>
		</Box>
	);
};

export default Surface;
