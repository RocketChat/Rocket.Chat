import type { Box } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';

import Title from './AttachmentTitle';
import { useFormatMemorySize } from '../../../../../hooks/useFormatMemorySize';

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
