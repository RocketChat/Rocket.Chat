import { usePrefersReducedMotion } from '@rocket.chat/fuselage-hooks';
import React, { ReactElement, ReactNode } from 'react';

import Line from './Line';
import Wrapper from './Wrapper';

const BurgerIcon = ({ children, open }: { children?: ReactNode; open?: boolean }): ReactElement => {
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
