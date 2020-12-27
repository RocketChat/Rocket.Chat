import { Box } from '@rocket.chat/fuselage';
import React, { memo } from 'react';

import {
	useLayoutContextualBarPosition,
	useLayoutSizes,
} from '../../providers/LayoutProvider';

const VerticalBar = ({ children, ...props }) => {
	const sizes = useLayoutSizes();
	const position = useLayoutContextualBarPosition();
	return <Box
		rcx-vertical-bar
		backgroundColor='surface'
		display='flex'
		flexDirection='column'
		flexShrink={0}
		width={sizes.contextualBar}
		borderInlineStartWidth='2px'
		borderInlineStartColor='neutral-300'
		borderInlineStartStyle='solid'
		height='full'
		position={position}
		zIndex={5}
		insetInlineEnd={'none'}
		insetBlockStart={'none'}
		{...props}
	>
		{children}
	</Box>;
};

export default memo(VerticalBar);
