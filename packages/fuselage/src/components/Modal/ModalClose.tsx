import { IconButton, type IconButtonProps } from '../Button';

export type ModalCloseProps = Omit<IconButtonProps, 'icon'>;

const ModalClose = (props: ModalCloseProps) => <IconButton aria-label='Close' {...props} small icon='cross' />;

export default ModalClose;
