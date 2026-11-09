import type { ElementProps } from '../../types/ElementProps.js';
import { Box } from '../Box/index.js';

export type ModalFooterAnnotationProps = ElementProps<HTMLDivElement>;

const ModalFooterAnnotation = (props: ModalFooterAnnotationProps) => <Box rcx-modal__footer-annotation {...props} />;

export default ModalFooterAnnotation;
