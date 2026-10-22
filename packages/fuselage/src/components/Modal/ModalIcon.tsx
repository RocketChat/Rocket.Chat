import { Box, type BoxProps } from '../Box';
import { Icon, type IconProps } from '../Icon';

const variantColors = {
	danger: 'danger',
	warning: 'status-font-on-warning',
	info: 'info',
	success: 'status-font-on-success',
} as const;

export type ModalIconProps = BoxProps & {
	name: IconProps['name'];
	/** Tints the icon with the status it stands for. */
	variant?: keyof typeof variantColors;
};

const ModalIcon = ({ size = 'x20', name, variant, alignItems = 'center', ...props }: ModalIconProps) => (
	<Box paddingBlock={4} color={variant && variantColors[variant]} {...props} display='flex' alignItems={alignItems}>
		<Icon name={name} size={size} />
	</Box>
);

export default ModalIcon;
