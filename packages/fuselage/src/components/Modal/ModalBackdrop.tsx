import { Box, type BoxProps } from '../Box';

export type ModalBackdropProps = BoxProps;

const ModalBackdrop = (props: ModalBackdropProps) => <Box rcx-modal__backdrop {...props} />;

export default ModalBackdrop;
