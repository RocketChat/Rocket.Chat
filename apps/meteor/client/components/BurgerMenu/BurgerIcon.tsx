import { usePrefersReducedMotion } from '@rocket.chat/fuselage-hooks';
import type { ReactElement, ReactNode } from 'react';
import React from 'react';

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
