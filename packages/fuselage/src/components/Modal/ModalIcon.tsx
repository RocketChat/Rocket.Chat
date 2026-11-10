import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';
import { Icon, type IconProps } from '../Icon';

export type ModalIconProps = ElementProps<HTMLDivElement> & {
	name: IconProps['name'];
	size?: IconProps['size'];
	/** Tints the icon with the status it stands for. */
	variant?: 'danger' | 'warning' | 'info' | 'success';
	/** Aligns the icon with the end of the header instead of its centre, for a header taller than one line. */
	align?: 'center' | 'end';
};

const ModalIcon = ({ size = 'x20', name, variant, align = 'center', ...props }: ModalIconProps) => (
	<Box rcx-modal__icon rcx-modal__icon--variant={variant} rcx-modal__icon--align={align} {...props}>
		<Icon name={name} size={size} />
	</Box>
);

export default ModalIcon;
