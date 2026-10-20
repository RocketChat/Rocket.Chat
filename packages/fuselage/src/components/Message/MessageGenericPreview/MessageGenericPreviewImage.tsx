import { styled, Text } from '@tamagui/web';
import type { ImgHTMLAttributes } from 'react';

import { prependClassName } from '../../../helpers/prependClassName';
import { withFuselageProvider } from '../../FuselageProvider/FuselageProvider';

const MessageGenericPreviewImageFrame = styled(Text, {
	boxSizing: 'content-box',
	// `inherit` sizes come from the surrounding markup
	width: 'fit-content',
	maxWidth: 'inherit',
	maxHeight: 'inherit',
	cursor: 'pointer',
});

export type MessageGenericPreviewImageProps = {
	url: string;
	className?: string;
} & ImgHTMLAttributes<HTMLImageElement>;

const MessageGenericPreviewImage = ({ url, className, ...props }: MessageGenericPreviewImageProps) => (
	<MessageGenericPreviewImageFrame
		className={prependClassName(className, 'rcx-message-generic-preview__image')}
		render={<img src={url} alt='' {...props} />}
	/>
);

export default withFuselageProvider(MessageGenericPreviewImage);
