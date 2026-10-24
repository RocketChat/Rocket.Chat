import { styled, Text } from '@tamagui/web';

import { prependClassName } from '../../../helpers/prependClassName';
import { withFuselageProvider } from '../../FuselageProvider/FuselageProvider';
import { plainDiv } from '../messageStyles';

const MessageGenericPreviewCoverImageFrame = styled(Text, {
	...plainDiv,
	display: 'inline-block',
	overflow: 'hidden',
	width: '100%',
	height: '100%',
	whiteSpace: 'nowrap',
	textIndent: '100%',
	backgroundRepeat: 'no-repeat',
	backgroundPosition: '50%',
	backgroundSize: 'cover',
});

export type MessageGenericPreviewCoverImageProps = {
	url: string;
	width: number;
	height: number;
	className?: string;
};

const MessageGenericPreviewCoverImage = ({ url, width, height, className, ...props }: MessageGenericPreviewCoverImageProps) => (
	<MessageGenericPreviewCoverImageFrame
		className={prependClassName(className, 'rcx-message-generic-preview__preview')}
		style={{ backgroundImage: `url(${url})`, maxWidth: '100%' }}
		data-testid='preview-image'
		{...props}
	>
		<div style={{ paddingTop: `${(height / width) * 100}%` }} />
	</MessageGenericPreviewCoverImageFrame>
);

export default withFuselageProvider(MessageGenericPreviewCoverImage);
