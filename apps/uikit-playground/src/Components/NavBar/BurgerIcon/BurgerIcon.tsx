import { usePrefersReducedMotion } from '@rocket.chat/fuselage-hooks';
import type { ReactNode } from 'react';
import { useContext } from 'react';

import Line from './Line';
import Wrapper from './Wrapper';
import { context } from '../../../Context';

const BurgerIcon = ({ children }: { children?: ReactNode }) => {
	const isReducedMotionPreferred = usePrefersReducedMotion();
	const {
		state: { navMenuToggle },
	} = useContext(context);

	return (
		<Wrapper>
			<Line animated={!isReducedMotionPreferred} moved={navMenuToggle} />
			<Line animated={!isReducedMotionPreferred} moved={navMenuToggle} />
			<Line animated={!isReducedMotionPreferred} moved={navMenuToggle} />
			{children}
		</Wrapper>
	);
};

export default BurgerIcon;
