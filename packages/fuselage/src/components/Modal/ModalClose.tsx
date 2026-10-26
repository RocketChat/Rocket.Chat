import { IconButton, type IconButtonProps } from '../Button';

export type ModalCloseProps = Omit<IconButtonProps, 'icon'>;

const ModalClose = (props: ModalCloseProps) => <IconButton aria-label='Close' small icon='cross' {...props} />;

export default ModalClose;
