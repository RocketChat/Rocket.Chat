import { Icon, IconButton, SplitButtonTrigger, type IconButtonSize } from '@rocket.chat/fuselage';
import type { Keys } from '@rocket.chat/icons';
import type { ComponentProps, ReactElement } from 'react';
import { forwardRef } from 'react';

import { getButtonVariant } from './getButtonVariant';

export type ActionButtonProps = {
	label: string;
	/** An icon by name, or something rendered in its place — a voice-activity indicator, say. */
	icon: Keys | ReactElement;
	/** `large` is the size used by the conference UI. The widget keeps its original size by default. */
	size?: 'tiny' | 'medium' | 'large';
	/** Fills the button; without it only the glyph shows. */
	secondary?: boolean;
	/** Marks an action that ends or discards something, such as hanging up. */
	danger?: boolean;
	/** Renders it as the menu segment of a fuselage `SplitButton`. */
	splitButtonTrigger?: boolean;
	disabled?: boolean;
	onClick?: () => void;
} & Omit<
	ComponentProps<typeof IconButton>,
	'icon' | 'aria-label' | 'disabled' | 'onClick' | 'variant' | 'primary' | 'info' | 'warning' | 'success' | keyof IconButtonSize
>;

const ActionButton = forwardRef<HTMLButtonElement, ActionButtonProps>(function ActionButton(
	{ disabled, label, icon, onClick, title, secondary = true, danger, size = 'medium', splitButtonTrigger = false, ...props },
	ref,
) {
	const Button = splitButtonTrigger ? SplitButtonTrigger : IconButton;

	return (
		<Button
			label={label}
			size={size}
			variant={getButtonVariant({ secondary, danger })}
			icon={typeof icon === 'string' ? <Icon size={size === 'large' ? 20 : 16} name={icon} /> : icon}
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
