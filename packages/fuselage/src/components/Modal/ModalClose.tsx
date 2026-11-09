import { IconButton, type IconButtonProps } from '../Button/index.js';

export type ModalCloseProps = Omit<IconButtonProps, 'icon'>;

const ModalClose = (props: ModalCloseProps) => <IconButton aria-label='Close' size='small' icon='cross' {...props} />;

export default ModalClose;
