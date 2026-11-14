import type { Box } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';

import Title from './AttachmentTitle';
import { useMessageMedia } from '../../../contexts/MessageMediaContext';

export type AttachmentSizeProps = ComponentPropsWithoutRef<typeof Box> & { size: number; wrapper?: boolean };

const AttachmentSize = ({ size, wrapper = true, ...props }: AttachmentSizeProps) => {
	const { formatFileSize } = useMessageMedia();

	const formattedSize = wrapper ? `(${formatFileSize(size)})` : formatFileSize(size);

	return (
		<Title flexShrink={0} {...props}>
			{formattedSize}
		</Title>
	);
};

export default AttachmentSize;
