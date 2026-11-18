import { IconButton, type IconButtonProps } from '@rocket.chat/fuselage';
import type { Keys as IconName } from '@rocket.chat/icons';
import type { ButtonHTMLAttributes } from 'react';

export type VideoConfControllerProps = {
	icon: IconName;
	active?: boolean;
	secondary?: boolean;
	disabled?: boolean;
	size?: IconButtonProps['size'];
} & Omit<ButtonHTMLAttributes<HTMLElement>, 'ref' | 'is' | 'className' | 'size' | 'elevation' | 'color'>;

const getVariant = ({ active, secondary, disabled }: Pick<VideoConfControllerProps, 'active' | 'secondary' | 'disabled'>) => {
	if (active) {
		return 'primary';
	}

	return secondary || disabled ? 'secondary' : undefined;
};

const VideoConfController = ({ icon, active, secondary, disabled, size = 'small', ...props }: VideoConfControllerProps) => (
	<IconButton
		aria-live='assertive'
		size={size}
		icon={icon}
		variant={getVariant({ active, secondary, disabled })}
		disabled={disabled}
		{...props}
	/>
);

export default VideoConfController;
