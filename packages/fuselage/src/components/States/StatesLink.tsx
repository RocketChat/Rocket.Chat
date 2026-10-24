import { styled, Text } from '@tamagui/web';
import type { AnchorHTMLAttributes } from 'react';

import { textIconColors } from '../../Theme';
import { asPublicFrame } from '../../helpers/asPublicFrame';
import { variantClass } from '../../helpers/variantClass';
import { fontFamily, fontScale, spacing } from '../../styleTokens';
import type { ElementProps } from '../../types/ElementProps';

export type StatesLinkProps = ElementProps<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement>>;

const StatesLinkFrame = styled(Text, {
	render: 'a',
	whiteSpace: 'normal',
	wordWrap: 'normal',
	marginBlock: spacing('x16'),
	outlineStyle: 'none',
	color: String(textIconColors['font-info']),
	fontFamily: fontFamily('sans'),
	fontVariantNumeric: 'tabular-nums',
	...(fontScale('p2') as object),

	variants: {
		// `rcx-box--with-inline-elements` styles the rich content nested in the link, which Tamagui can't reach
		rcx: { true: variantClass('rcx-states__link rcx-box--with-inline-elements') },
	} as const,

	defaultVariants: { rcx: true },
});

export default asPublicFrame<StatesLinkProps>(StatesLinkFrame);
