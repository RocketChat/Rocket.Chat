import { Box, type BoxProps } from '../Box';
import { Icon, type IconProps } from '../Icon';

export type ModalIconProps = BoxProps & {
	name: IconProps['name'];
};

const ModalIcon = ({ size = 'x20', name, alignItems = 'center', ...props }: ModalIconProps) => (
	<Box {...props} display='flex' alignItems={alignItems}>
		<Icon marginBlock={4} name={name} size={size} />
	</Box>
);

export default ModalIcon;
