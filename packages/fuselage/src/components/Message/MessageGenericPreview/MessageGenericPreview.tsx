import { styled, Text, type GetProps } from '@tamagui/web';
import type { HTMLAttributes } from 'react';

import { strokeColors, surfaceColors, textIconColors } from '../../../Theme';
import { toCSSValue } from '../../../helpers/toCSSValue';
import { borderRadius, borderWidth } from '../../../styleTokens';
import { withFuselageProvider } from '../../FuselageProvider/FuselageProvider';
import { plainDiv } from '../messageStyles';

export const previewContextColor = toCSSValue('--rcx-message-generic-preview-context-color', textIconColors['font-secondary-info']);
export const previewTitleColor = toCSSValue('--rcx-message-generic-preview-title-color', textIconColors['font-default']);
export const previewBorderRadius = toCSSValue('--rcx-border-radius-medium', borderRadius('medium')!);

const MessageGenericPreviewFrame = styled(Text, {
	...plainDiv,
	display: 'flex',
	flexDirection: 'column',
	overflow: 'hidden',
	color: previewContextColor,
	borderWidth: borderWidth('default'),
	borderStyle: 'solid',
	borderColor: toCSSValue('--rcx-message-generic-preview-border-color', strokeColors['stroke-extra-light']),
	borderRadius: previewBorderRadius,
	backgroundColor: toCSSValue('--rcx-message-generic-preview-content-background-color', surfaceColors['surface-tint']),
	fontSize: 0,
});

export type MessageGenericPreviewProps = HTMLAttributes<HTMLDivElement>;

const MessageGenericPreview = (props: MessageGenericPreviewProps) => (
	<MessageGenericPreviewFrame className='rcx-message-generic-preview' {...(props as GetProps<typeof MessageGenericPreviewFrame>)} />
);

export default withFuselageProvider(MessageGenericPreview);
