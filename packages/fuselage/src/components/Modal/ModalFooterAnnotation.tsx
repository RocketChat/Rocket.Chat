import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';

export type ModalFooterAnnotationProps = ElementProps<HTMLDivElement>;

/** A short note on the start side of the footer; set `justify='space-between'` on the `ModalFooter`. */
const ModalFooterAnnotation = (props: ModalFooterAnnotationProps) => <Box rcx-modal__footer-annotation {...props} />;

export default ModalFooterAnnotation;
