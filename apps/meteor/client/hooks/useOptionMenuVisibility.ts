import { usePrefersReducedMotion } from '@rocket.chat/fuselage-hooks';
import { useState } from 'react';

export const useOptionMenuVisibility = () => {
	const [showMenu, setShowMenu] = useState(false);

	const isReduceMotionEnabled = usePrefersReducedMotion();
	const optionMenuEvent = {
		[isReduceMotionEnabled ? 'onMouseEnter' : 'onTransitionEnd']: setShowMenu,
	};

	return { optionMenuEvent, showMenu };
};
