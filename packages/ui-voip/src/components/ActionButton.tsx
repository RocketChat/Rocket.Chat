import { Icon, IconButton } from '@rocket.chat/fuselage';
import type { Keys } from '@rocket.chat/icons';
import type { ComponentProps, ReactElement } from 'react';
import { forwardRef } from 'react';

export type ActionButtonProps = {
	label: string;
	/** An icon by name, or something rendered in its place — a voice-activity indicator, say. */
	icon: Keys | ReactElement;
	disabled?: boolean;
	onClick?: () => void;
} & Omit<ComponentProps<typeof IconButton>, 'icon' | 'aria-label' | 'disabled' | 'onClick'>;

const ActionButton = forwardRef<HTMLButtonElement, ActionButtonProps>(function ActionButton(
	{ disabled, label, icon, onClick, title, secondary = true, ...props },
	ref,
) {
	return (
		<IconButton
			label={label}
			large
			secondary={secondary}
			icon={typeof icon === 'string' ? <Icon size={20} name={icon} /> : icon}
			title={title || label}
			aria-label={label}
			disabled={disabled}
			onClick={onClick}
			{...props}
			ref={ref}
		/>
	);
});

export default ActionButton;
