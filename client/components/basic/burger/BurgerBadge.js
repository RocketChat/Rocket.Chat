import { Badge } from '@rocket.chat/fuselage';
import React from 'react';

function BurgerBadge({ children }) {
	return <Badge
		position='absolute'
		insetInlineEnd='neg-x8'
		insetBlockStart='neg-x4'
		zIndex='3'
		variant='danger'
		children={children}
	/>;
}

export default BurgerBadge;
