import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';

export type ModalFooterAnnotationProps = ElementProps<HTMLDivElement>;

const ModalFooterAnnotation = ({ children }: ModalFooterAnnotationProps) => <Box rcx-modal__footer-annotation>{children}</Box>;

export default ModalFooterAnnotation;
