import { Badge } from '@rocket.chat/fuselage';
import React from 'react';

function BurgerBadge({ children }) {
	return <Badge
		style={{
			position: 'absolute',
			zIndex: '3',
			insetInlineEnd: 'neg-x8',
			insetBlockStart: 'neg-x4',
		}}
		variant='danger'
		children={children}
	/>;
}

export default BurgerBadge;
