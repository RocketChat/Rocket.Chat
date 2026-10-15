import { Avatar, type AvatarProps } from '../Avatar';
import { Box } from '../Box';

export type ModalThumbProps = AvatarProps;

const ModalThumb = (props: ModalThumbProps) => (
	<Box>
		<Avatar size='x28' {...props} />
	</Box>
);

export default ModalThumb;
