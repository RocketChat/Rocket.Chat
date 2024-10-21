import { Icon, IconButton } from '@rocket.chat/fuselage';
import type { Keys } from '@rocket.chat/icons';
import type { ComponentPropsWithoutRef } from 'react';

type ActionButtonProps = Pick<ComponentPropsWithoutRef<typeof IconButton>, 'className' | 'disabled' | 'pressed' | 'danger' | 'success'> & {
	label: string;
	icon: Keys;
	onClick?: () => void;
};

const VoipActionButton = ({ disabled, label, pressed, icon, danger, success, className, onClick }: ActionButtonProps) => (
	<IconButton
		medium
		danger={danger}
		success={success}
		secondary={success || danger}
		className={className}
		icon={<Icon name={icon} />}
		title={label}
		pressed={pressed}
		aria-label={label}
		disabled={disabled}
		onClick={() => onClick?.()}
	/>
);

export default VoipActionButton;
