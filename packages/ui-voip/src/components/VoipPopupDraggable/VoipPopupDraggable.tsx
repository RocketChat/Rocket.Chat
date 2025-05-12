import { Box } from '@rocket.chat/fuselage';
import { useLayoutEffect, useState } from 'react';

import { useDraggable } from './DraggableCore2';
import VoipPopup from '../VoipPopup/VoipPopup';
import type { PositionOffsets } from '../VoipPopup/components/VoipPopupContainer';

type VoipPopupDraggableProps = {
	initialPosition?: PositionOffsets;
};

const VoipPopupDraggable = ({ initialPosition = { top: 20, right: 20 } }: VoipPopupDraggableProps) => {
	const [draggableRef, containerRef, handleElementRef] = useDraggable();
	const [state, setState] = useState(0);

	// console.log(state, (...args) => setState(...args));

	useLayoutEffect(() => {
		containerRef(document.querySelector('body'));
	}, [containerRef]);

	console.log(state);

	if (state === 1) {
		return (
			<Box key={state} display='flex' flexDirection='column' ref={draggableRef} width={300} height={300} backgroundColor='purple'>
				<Box w='100%' h={100} ref={handleElementRef}>
					HANDLE
				</Box>
				<Box w='100%' h={200} backgroundColor='orange' onClick={() => setState(2)}>
					body
				</Box>
			</Box>
		);
	}

	if (state === 2) {
		return (
			<Box key={state} display='flex' flexDirection='column' ref={draggableRef} width={300} height={300} backgroundColor='green'>
				<Box w='100%' h={100} ref={handleElementRef}>
					HANDLE
				</Box>
				<Box w='100%' h={200} backgroundColor='yellow' onClick={() => setState(0)}>
					body
				</Box>
			</Box>
		);
	}

	return (
		<Box key={state} display='flex' flexDirection='column' ref={draggableRef} width={300} height={300} backgroundColor='blue'>
			<Box w='100%' h={100} ref={handleElementRef}>
				HANDLE
			</Box>
			<Box w='100%' h={200} backgroundColor='red' onClick={() => setState(1)}>
				body
			</Box>
		</Box>
	);
	// return <VoipPopup ref={draggableRef} position={initialPosition} dragHandleRef={handleElementRef} />;
};

export default VoipPopupDraggable;
