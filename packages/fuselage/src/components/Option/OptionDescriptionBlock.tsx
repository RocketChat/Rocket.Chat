import { styled, Text } from '@tamagui/web';
import type { HTMLAttributes, ReactNode } from 'react';

import { textIconColors } from '../../Theme';
import { asPublicFrame } from '../../helpers/asPublicFrame';
import { variantClass } from '../../helpers/variantClass';
import { fontScale, spacing } from '../../styleTokens';

const { fontWeight, ...p2 } = fontScale('p2');

const OptionDescriptionBlockFrame = styled(Text, {
	render: 'div',
	display: 'block',
	padding: spacing('x4'),
	whiteSpace: 'normal',
	wordBreak: 'break-word',
	wordWrap: 'inherit',
	color: String(textIconColors['font-secondary-info']),
	...p2,
	fontWeight: fontWeight as 400,

	variants: {
		rcx: { true: variantClass('rcx-option__description-block') },
	} as const,

	defaultVariants: { rcx: true },
});

export type OptionDescriptionBlockProps = {
	children?: ReactNode;
} & HTMLAttributes<HTMLDivElement>;

export default asPublicFrame<OptionDescriptionBlockProps>(OptionDescriptionBlockFrame);
