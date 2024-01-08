import { IconButton } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import type { Keys as IconName } from '@rocket.chat/icons';
import type { ReactElement, ButtonHTMLAttributes } from 'react';

type VideoConfControllerProps = {
	icon: IconName;
	active?: boolean;
	secondary?: boolean;
	disabled?: boolean;
	small?: boolean;
} & Omit<ButtonHTMLAttributes<HTMLElement>, 'ref' | 'is' | 'className' | 'size' | 'elevation'>;

const VideoConfController = ({ icon, active, secondary, disabled, small = true, ...props }: VideoConfControllerProps): ReactElement => {
	const id = useUniqueId();

	return (
		<IconButton
			small={small}
			icon={icon}
			id={id}
			info={active}
			disabled={disabled}
			secondary={secondary || active || disabled}
			{...props}
		/>
	);
};

export default VideoConfController;
