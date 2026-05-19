import { useLayoutEffect, useRef } from 'react';

import { useMediaCallWidgetSlot } from '../context/MediaCallWidgetSlotContext';

const slotStyle = { display: 'flex', alignItems: 'flex-start', flex: '0 0 auto', width: '100%' } as const;

const MediaCallWidgetSlot = () => {
	const ref = useRef<HTMLDivElement>(null);
	const { setSlot } = useMediaCallWidgetSlot();

	useLayoutEffect(() => {
		setSlot(ref.current);
		return () => setSlot(null);
	}, [setSlot]);

	return <div ref={ref} style={slotStyle} />;
};

export default MediaCallWidgetSlot;
