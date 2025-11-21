import { Icon, IconButton } from '@rocket.chat/fuselage';
import type { Keys } from '@rocket.chat/icons';
import type { ComponentProps } from 'react';
import { forwardRef } from 'react';

type ActionButtonProps = {
	label: string;
	icon: Keys;
	disabled?: boolean;
	onClick?: () => void;
} & Omit<ComponentProps<typeof IconButton>, 'icon' | 'title' | 'aria-label' | 'disabled' | 'onClick'>;

const ActionButton = forwardRef<HTMLButtonElement, ActionButtonProps>(function ActionButton(
	{ disabled, label, icon, onClick, secondary = true, ...props },
	ref,
) {
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
			ref={ref}
		/>
	);
});

export default ActionButton;
