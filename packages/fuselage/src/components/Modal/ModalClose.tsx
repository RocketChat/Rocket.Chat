import { IconButton, type IconButtonProps } from '../Button';

export type ModalCloseProps = Omit<IconButtonProps, 'icon'>;

/** Close button for the header, named "Close" for assistive technology; closing the modal is up to its `onClick`. */
const ModalClose = (props: ModalCloseProps) => <IconButton aria-label='Close' size='small' icon='cross' {...props} />;

export default ModalClose;
