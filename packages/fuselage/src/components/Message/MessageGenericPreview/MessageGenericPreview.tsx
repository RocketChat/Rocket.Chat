import { styled, Text } from '@tamagui/web';
import type { HTMLAttributes } from 'react';

import { strokeColors, surfaceColors, textIconColors } from '../../../Theme';
import { asPublicFrame } from '../../../helpers/asPublicFrame';
import { toCSSValue } from '../../../helpers/toCSSValue';
import { variantClass } from '../../../helpers/variantClass';
import { borderRadius, borderWidth } from '../../../styleTokens';
import { plainDiv } from '../messageStyles';

export const previewContextColor = toCSSValue('--rcx-message-generic-preview-context-color', textIconColors['font-secondary-info']);
export const previewTitleColor = toCSSValue('--rcx-message-generic-preview-title-color', textIconColors['font-default']);
export const previewBorderRadius = toCSSValue('--rcx-border-radius-medium', borderRadius('medium'));

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

	variants: {
		rcx: { true: variantClass('rcx-message-generic-preview') },
	} as const,

	defaultVariants: { rcx: true },
});

export type MessageGenericPreviewProps = HTMLAttributes<HTMLDivElement>;

export default asPublicFrame<MessageGenericPreviewProps>(MessageGenericPreviewFrame);
