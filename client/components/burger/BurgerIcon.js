import { usePrefersReducedMotion } from '@rocket.chat/fuselage-hooks';
import React from 'react';

import Line from './Line';
import Wrapper from './Wrapper';

function BurgerIcon({ children, open }) {
	const isReducedMotionPreferred = usePrefersReducedMotion();

	return (
		<Wrapper>
			<Line animated={!isReducedMotionPreferred} moved={open} />
			<Line animated={!isReducedMotionPreferred} moved={open} />
			<Line animated={!isReducedMotionPreferred} moved={open} />
			{children}
		</Wrapper>
	);
}

export default BurgerIcon;
