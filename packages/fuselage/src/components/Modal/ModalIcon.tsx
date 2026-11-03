import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';
import { Icon, type IconProps } from '../Icon';

const variantColors = {
	danger: 'danger',
	warning: 'status-font-on-warning',
	info: 'info',
	success: 'status-font-on-success',
} as const;

export type ModalIconProps = ElementProps<HTMLDivElement> & {
	name: IconProps['name'];
	size?: IconProps['size'];
	/** Tints the icon with the status it stands for. */
	variant?: keyof typeof variantColors;
	/** Aligns the icon with the end of the header instead of its centre, for a header taller than one line. */
	align?: 'center' | 'end';
};

const ModalIcon = ({ size = 'x20', name, variant, align = 'center', ...props }: ModalIconProps) => (
	<Box paddingBlock={4} color={variant && variantColors[variant]} {...props} display='flex' alignItems={align}>
		<Icon name={name} size={size} />
	</Box>
);

export default ModalIcon;
