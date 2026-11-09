import { Avatar, type AvatarProps } from '../Avatar/index.js';
import { Box } from '../Box/index.js';

export type ModalThumbProps = AvatarProps;

const ModalThumb = (props: ModalThumbProps) => (
	<Box>
		<Avatar size='x28' {...props} />
	</Box>
);

export default ModalThumb;
