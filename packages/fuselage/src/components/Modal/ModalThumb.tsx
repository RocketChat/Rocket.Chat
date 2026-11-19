import { Avatar, type AvatarProps } from '../Avatar';
import { Box } from '../Box';

export type ModalThumbProps = AvatarProps;

/** Small avatar at the start of the header, such as the icon of the app that opened the modal. */
const ModalThumb = (props: ModalThumbProps) => (
	<Box>
		<Avatar size='x28' {...props} />
	</Box>
);

export default ModalThumb;
