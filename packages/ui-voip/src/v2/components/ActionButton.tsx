import { Icon, IconButton } from '@rocket.chat/fuselage';
import type { Keys } from '@rocket.chat/icons';
import type { ComponentPropsWithoutRef } from 'react';

type ActionButtonProps = Pick<ComponentPropsWithoutRef<typeof IconButton>, 'className' | 'disabled' | 'pressed' | 'danger' | 'success'> & {
	label: string;
	icon: Keys;
	pressedIcon?: Keys;
	onClick?: () => void;
};

const ActionButton = ({ disabled, label, pressed, pressedIcon, icon, danger, success, className, onClick }: ActionButtonProps) => (
	<IconButton
		medium
		secondary
		danger={danger}
		success={success}
		className={className}
		icon={<Icon size={16} color={pressed ? 'font-danger' : undefined} name={pressed ? (pressedIcon ?? icon) : icon} />}
		title={label}
		pressed={pressed}
		aria-label={label}
		disabled={disabled}
		onClick={() => onClick?.()}
	/>
);

export default ActionButton;
