import { useLayoutEffect } from 'react';

import { useDraggable } from './DraggableCore';
import VoipPopup from '../VoipPopup';
import type { PositionOffsets } from '../VoipPopup/components/VoipPopupContainer';

type VoipPopupDraggableProps = {
	initialPosition?: PositionOffsets;
};

const VoipPopupDraggable = ({ initialPosition = { top: 20, right: 20 } }: VoipPopupDraggableProps) => {
	const [draggableRef, containerRef, handleElementRef] = useDraggable();

	useLayoutEffect(() => {
		containerRef(document.querySelector('body'));
	}, [containerRef]);

	return <VoipPopup ref={draggableRef} position={initialPosition} dragHandleRef={handleElementRef} />;
};

export default VoipPopupDraggable;
