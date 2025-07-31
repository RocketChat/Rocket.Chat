import { Icon, IconButton } from '@rocket.chat/fuselage';
import type { Keys } from '@rocket.chat/icons';
import { ComponentProps } from 'react';

type ToggleButtonProps = {
	label: string;
	icons: [defaultIcon: Keys, pressedIcon: Keys];
	disabled?: boolean;
	pressed?: boolean;
	onToggle?: () => void;
} & Omit<ComponentProps<typeof IconButton>, 'icon' | 'title' | 'aria-label' | 'disabled' | 'onClick'>;

const ToggleButton = ({ disabled, label, pressed, icons, onToggle, ...props }: ToggleButtonProps) => {
	const iconName = icons[pressed ? 1 : 0];
	const iconColor = pressed ? 'font-danger' : undefined;

	return (
		<IconButton
			{...props}
			label={label}
			medium
			secondary
			icon={<Icon size={16} color={iconColor} name={iconName} />}
			title={label}
			pressed={pressed}
			aria-label={label}
			disabled={disabled}
			onClick={onToggle}
		/>
	);
};

export default ToggleButton;
