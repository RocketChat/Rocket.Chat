import type { IconButtonProps } from '@rocket.chat/fuselage';

/** The variant for a media control that is filled when `secondary`, and alarming when `danger`. */
export const getButtonVariant = ({ secondary, danger }: { secondary: boolean; danger?: boolean }): IconButtonProps['variant'] => {
	if (danger) {
		return secondary ? 'secondary-danger' : 'danger';
	}

	return secondary ? 'secondary' : undefined;
};
