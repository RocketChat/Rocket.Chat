import { usePrefersReducedMotion } from '@rocket.chat/fuselage-hooks';
import React, { FC } from 'react';

import Line from './Line';
import Wrapper from './Wrapper';

interface IBurguerIcon {
	open: string;
}

const BurgerIcon: FC<IBurguerIcon> = ({ children, open }) => {
	const isReducedMotionPreferred = usePrefersReducedMotion();

	return (
		<Wrapper>
			<Line animated={!isReducedMotionPreferred} moved={open} />
			<Line animated={!isReducedMotionPreferred} moved={open} />
			<Line animated={!isReducedMotionPreferred} moved={open} />
			{children}
		</Wrapper>
	);
};

export default BurgerIcon;
