import { Icon, IconButton } from '@rocket.chat/fuselage';
import type { Keys } from '@rocket.chat/icons';
import type { ComponentProps, ReactElement } from 'react';
import { forwardRef } from 'react';

export type ActionButtonProps = {
	label: string;
	/** An icon by name, or something rendered in its place — a voice-activity indicator, say. */
	icon: Keys | ReactElement;
	/** Renders the larger variant used by the conference UI. The widget keeps its original size by default. */
	large?: boolean;
	disabled?: boolean;
	onClick?: () => void;
} & Omit<ComponentProps<typeof IconButton>, 'icon' | 'aria-label' | 'disabled' | 'onClick'>;

const ActionButton = forwardRef<HTMLButtonElement, ActionButtonProps>(function ActionButton(
	{ disabled, label, icon, onClick, title, secondary = true, large = false, ...props },
	ref,
) {
	return (
		<IconButton
			label={label}
			{...(large ? { large: true } : { medium: true })}
			secondary={secondary}
			icon={typeof icon === 'string' ? <Icon size={large ? 20 : 16} name={icon} /> : icon}
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
