import { Icon, IconButton } from '@rocket.chat/fuselage';
import type { Keys } from '@rocket.chat/icons';
import type { ComponentProps } from 'react';

type ToggleButtonProps = {
	label: string; // label should not change due to a11y constraints
	icons: [defaultIcon: Keys, pressedIcon: Keys];
	titles: [defaultTitle: string, pressedTitle: string]; // Titles might change though
	disabled?: boolean;
	pressed?: boolean;
	onToggle?: () => void;
} & Omit<ComponentProps<typeof IconButton>, 'icon' | 'title' | 'aria-label' | 'disabled' | 'onClick'>;

const ToggleButton = ({ disabled, label, pressed, icons, titles, onToggle, ...props }: ToggleButtonProps) => {
	const iconName = icons[pressed ? 1 : 0];
	const title = titles[pressed ? 1 : 0];
	const iconColor = pressed ? 'font-danger' : undefined;

	return (
		<IconButton
			{...props}
			label={label}
			medium
			secondary
			icon={<Icon size={16} color={iconColor} name={iconName} />}
			title={title}
			pressed={pressed}
			aria-label={label}
			disabled={disabled}
			onClick={onToggle}
		/>
	);
};

export default ToggleButton;
