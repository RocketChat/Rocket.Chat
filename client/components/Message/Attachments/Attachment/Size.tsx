import { Box } from '@rocket.chat/fuselage';
import React, { ComponentProps, FC } from 'react';

import { useFormatMemorySize } from '../../../../hooks/useFormatMemorySize';
import Title from './Title';

const Size: FC<ComponentProps<typeof Box> & { size: number }> = ({ size, ...props }) => {
	const format = useFormatMemorySize();
	return (
		<Title flexShrink={0} {...props}>
			({format(size)})
		</Title>
	);
};

export default Size;
