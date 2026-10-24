import { styled, Text } from '@tamagui/web';

import { modalBoxFont } from './Modal';
import { textIconColors } from '../../Theme';
import { asPublicFrame } from '../../helpers/asPublicFrame';
import { variantClass } from '../../helpers/variantClass';
import { fontScale } from '../../styleTokens';
import type { ElementProps } from '../../types/ElementProps';

export type ModalTitleProps = ElementProps<HTMLHeadingElement>;

const ModalTitleFrame = styled(Text, {
	render: 'h2',
	display: 'block',
	flexGrow: 1,
	flexShrink: 1,
	whiteSpace: 'nowrap',
	wordWrap: 'inherit',
	overflow: 'hidden',
	textOverflow: 'ellipsis',
	color: String(textIconColors['font-default']),
	...modalBoxFont,
	...(fontScale('h2') as object),

	variants: {
		rcx: { true: variantClass('rcx-modal__title') },
	} as const,

	defaultVariants: { rcx: true },
});

export default asPublicFrame<ModalTitleProps>(ModalTitleFrame);
