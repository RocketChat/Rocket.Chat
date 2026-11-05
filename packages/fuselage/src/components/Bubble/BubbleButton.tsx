import type { Keys as IconName } from '@rocket.chat/icons';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { Icon } from '../Icon';

type BubbleButtonProps = {
	onClick: () => void;
	label?: ReactNode;
	secondary?: boolean;
	icon?: IconName;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'>;

export const BubbleButton = ({ secondary, label, onClick, icon, ...props }: BubbleButtonProps) => (
	<button
		className={`rcx-box rcx-box--full rcx-bubble__button ${secondary ? 'rcx-bubble__button--secondary' : 'rcx-bubble__button--primary'}`}
		onClick={onClick}
		{...props}
	>
		{icon && <Icon name={icon} size='x16' />}
		{label && <span>{label}</span>}
	</button>
);
