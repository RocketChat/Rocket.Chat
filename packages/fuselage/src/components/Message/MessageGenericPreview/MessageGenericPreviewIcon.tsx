import { styled, Text } from '@tamagui/web';

import { previewBorderRadius, previewTitleColor } from './MessageGenericPreview';
import { surfaceColors } from '../../../Theme';
import { toCSSValue } from '../../../helpers/toCSSValue';
import { size, spacing } from '../../../styleTokens';
import { withFuselageProvider } from '../../FuselageProvider/FuselageProvider';
import { Icon, type IconProps } from '../../Icon';
import { plainDiv, textScale, truncatedText } from '../messageStyles';

const MessageGenericPreviewIconFrame = styled(Text, {
	...plainDiv,
	display: 'flex',
	flexDirection: 'column',
	justifyContent: 'center',
	alignItems: 'center',
	flexShrink: 0,
	alignSelf: 'center',
	width: size('x48'),
	height: size('x52'),
	marginBlock: spacing('x12'),
	marginInlineStart: spacing('x16'),
	borderRadius: previewBorderRadius,
	backgroundColor: toCSSValue('--rcx-message-generic-preview-icon-background-color', surfaceColors['surface-neutral']),
});

const MessageGenericPreviewIconTitle = styled(Text, {
	...plainDiv,
	...truncatedText,
	...textScale('micro'),
	maxWidth: size('x40'),
	color: previewTitleColor,
});

export type MessageGenericPreviewIconProps = IconProps & {
	type: string;
};

const MessageGenericPreviewIcon = ({
	name = 'attachment-file',
	size = 32,
	color = 'default',
	type = 'file',
}: MessageGenericPreviewIconProps) => (
	<MessageGenericPreviewIconFrame className='rcx-message-generic-preview__icon'>
		<Icon name={name} color={color} size={size} />
		<MessageGenericPreviewIconTitle className='rcx-message-generic-preview__icon-title'>{type}</MessageGenericPreviewIconTitle>
	</MessageGenericPreviewIconFrame>
);

export default withFuselageProvider(MessageGenericPreviewIcon);
