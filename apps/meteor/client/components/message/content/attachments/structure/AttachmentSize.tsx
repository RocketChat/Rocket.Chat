import type { Box } from '@rocket.chat/fuselage';
import type { ComponentProps, FC } from 'react';
import React from 'react';

import { useFormatMemorySize } from '../../../../../hooks/useFormatMemorySize';
import Title from './AttachmentTitle';

const AttachmentSize: FC<ComponentProps<typeof Box> & { size: number; wrapper?: boolean }> = ({ size, wrapper = true, ...props }) => {
	const format = useFormatMemorySize();

	const formattedSize = wrapper ? `(${format(size)})` : format(size);

	return (
		<Title flexShrink={0} {...props}>
			{formattedSize}
		</Title>
	);
};

export default AttachmentSize;
