import { css } from '@rocket.chat/css-in-js';

import Title from './AttachmentTitle';
import { useFormatMemorySize } from '../../../../../hooks/useFormatMemorySize';

export type AttachmentSizeProps = { size: number; wrapper?: boolean };

const noShrink = css`
	flex-shrink: 0;
`;

const AttachmentSize = ({ size, wrapper = true }: AttachmentSizeProps) => {
	const format = useFormatMemorySize();

	const formattedSize = wrapper ? `(${format(size)})` : format(size);

	return <Title className={noShrink}>{formattedSize}</Title>;
};

export default AttachmentSize;
