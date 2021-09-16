import { usePrefersReducedMotion } from '@rocket.chat/fuselage-hooks';
import React, { ReactElement, ReactNode } from 'react';

import Line from './Line';
import Wrapper from './Wrapper';

function BurgerIcon({ children, open }: { children?: ReactNode; open: string }): ReactElement {
	const isReducedMotionPreferred = usePrefersReducedMotion();

	console.log(open);

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
