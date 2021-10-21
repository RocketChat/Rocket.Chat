import { Box } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

import NegativeGrowthSymbol from './NegativeGrowthSymbol';
import PositiveGrowthSymbol from './PositiveGrowthSymbol';

type FontScale = 'h1' | 's1' | 's2' | 'p1' | 'p2' | 'c1' | 'c2' | 'micro';
interface IGrowth {
	fontScale: FontScale;
}

const Growth: FC<IGrowth> = ({ children, ...props }) => {
	if (children === 0 || children === null || children === undefined) {
		return null;
	}

	return (
		<Box is='span' color={children < 0 ? 'danger' : 'success'} {...props}>
			{children < 0 ? <NegativeGrowthSymbol /> : <PositiveGrowthSymbol />}
			{String(Math.abs(Number(children)))}
		</Box>
	);
};

export default Growth;
