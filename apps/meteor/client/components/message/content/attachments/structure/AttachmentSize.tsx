import type { Box } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';
import React from 'react';

import { useFormatMemorySize } from '../../../../../hooks/useFormatMemorySize';
import Title from './AttachmentTitle';

type AttachmentSizeProps = ComponentPropsWithoutRef<typeof Box> & { size: number; wrapper?: boolean };

const AttachmentSize = ({ size, wrapper = true, ...props }: AttachmentSizeProps) => {
	const format = useFormatMemorySize();

	const formattedSize = wrapper ? `(${format(size)})` : format(size);

	return (
		<Title flexShrink={0} {...props}>
			{formattedSize}
		</Title>
	);
};

export default AttachmentSize;
