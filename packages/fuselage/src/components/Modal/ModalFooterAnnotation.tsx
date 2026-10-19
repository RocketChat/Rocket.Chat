import { Box, type BoxProps } from '../Box';

export type ModalFooterAnnotationProps = BoxProps;

const ModalFooterAnnotation = ({ children }: ModalFooterAnnotationProps) => <Box rcx-modal__footer-annotation>{children}</Box>;

export default ModalFooterAnnotation;
