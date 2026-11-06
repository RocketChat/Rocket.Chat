import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';

export type ModalFooterAnnotationProps = ElementProps<HTMLDivElement>;

const ModalFooterAnnotation = (props: ModalFooterAnnotationProps) => <Box rcx-modal__footer-annotation {...props} />;

export default ModalFooterAnnotation;
