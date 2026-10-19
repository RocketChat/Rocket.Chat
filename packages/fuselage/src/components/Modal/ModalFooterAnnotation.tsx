import { styled, Text } from '@tamagui/web';

import { modalBoxFont } from './Modal';
import { textIconColors } from '../../Theme';
import { fontScale } from '../../styleTokens';
import type { BoxProps } from '../Box';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

export type ModalFooterAnnotationProps = BoxProps;

const ModalFooterAnnotationFrame = styled(Text, {
	render: 'div',
	display: 'block',
	whiteSpace: 'inherit',
	wordWrap: 'inherit',
	color: String(textIconColors['font-secondary-info']),
	...modalBoxFont,
	...(fontScale('c1') as object),
});

const ModalFooterAnnotation = ({ children }: ModalFooterAnnotationProps) => (
	<ModalFooterAnnotationFrame className='rcx-modal__footer-annotation'>{children}</ModalFooterAnnotationFrame>
);

export default withFuselageProvider(ModalFooterAnnotation);
