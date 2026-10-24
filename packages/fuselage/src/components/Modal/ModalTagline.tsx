import { styled, Text } from '@tamagui/web';

import { modalBoxFont } from './Modal';
import { textIconColors } from '../../Theme';
import { asPublicFrame } from '../../helpers/asPublicFrame';
import { variantClass } from '../../helpers/variantClass';
import { fontScale } from '../../styleTokens';
import type { ElementProps } from '../../types/ElementProps';

export type ModalTaglineProps = ElementProps<HTMLDivElement> & {
	/** Mutes the tagline, so it reads as a category above the title. */
	subtle?: boolean;
};

const ModalTaglineFrame = styled(Text, {
	render: 'div',
	display: 'block',
	whiteSpace: 'inherit',
	wordWrap: 'inherit',
	color: String(textIconColors['font-default']),
	...modalBoxFont,
	...(fontScale('c2') as object),

	variants: {
		rcx: { true: variantClass('rcx-modal__tagline') },
		subtle: {
			true: { color: String(textIconColors['font-annotation']) },
		},
	} as const,

	defaultVariants: { rcx: true },
});

export default asPublicFrame<ModalTaglineProps>(ModalTaglineFrame);
