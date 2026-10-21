import { styled, Text } from '@tamagui/web';

import { modalBoxFont } from './Modal';
import { textIconColors } from '../../Theme';
import { asPublicFrame } from '../../helpers/asPublicFrame';
import { variantClass } from '../../helpers/variantClass';
import { fontScale } from '../../styleTokens';
import type { BoxProps } from '../Box';

export type ModalFooterAnnotationProps = BoxProps;

const ModalFooterAnnotationFrame = styled(Text, {
	render: 'div',
	display: 'block',
	whiteSpace: 'inherit',
	wordWrap: 'inherit',
	color: String(textIconColors['font-secondary-info']),
	...modalBoxFont,
	...(fontScale('c1') as object),

	variants: {
		rcx: { true: variantClass('rcx-modal__footer-annotation') },
	} as const,

	defaultVariants: { rcx: true },
});

export default asPublicFrame<ModalFooterAnnotationProps>(ModalFooterAnnotationFrame);
