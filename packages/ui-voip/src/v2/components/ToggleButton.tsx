import { Icon, IconButton } from '@rocket.chat/fuselage';
import type { Keys } from '@rocket.chat/icons';

type ToggleButtonProps = {
	label: string;
	icons: [defaultIcon: Keys, pressedIcon: Keys];
	disabled?: boolean;
	pressed?: boolean;
	onToggle?: () => void;
};

const ToggleButton = ({ disabled, label, pressed, icons, onToggle }: ToggleButtonProps) => {
	const iconName = icons[pressed ? 1 : 0];
	const iconColor = pressed ? 'font-danger' : undefined;

	return (
		<IconButton
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
