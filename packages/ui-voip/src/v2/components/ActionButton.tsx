import { Icon, IconButton } from '@rocket.chat/fuselage';
import type { Keys } from '@rocket.chat/icons';
import { ComponentProps } from 'react';

type ActionButtonProps = {
	label: string;
	icon: Keys;
	disabled?: boolean;
	onClick?: () => void;
} & Omit<ComponentProps<typeof IconButton>, 'icon' | 'title' | 'aria-label' | 'disabled' | 'onClick'>;

const ActionButton = ({ disabled, label, icon, onClick, secondary = true, ...props }: ActionButtonProps) => {
	return (
		<IconButton
			label={label}
			medium
			secondary={secondary}
			icon={<Icon size={16} name={icon} />}
			title={label}
			aria-label={label}
			disabled={disabled}
			onClick={onClick}
			{...props}
		/>
	);
};

export default ActionButton;
