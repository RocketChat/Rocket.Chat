import type { Keys as IconName } from '@rocket.chat/icons';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { prependClassName } from '../../helpers/prependClassName';
import { Icon } from '../Icon';

type BubbleButtonProps = {
	onClick: () => void;
	label?: ReactNode;
	secondary?: boolean;
	icon?: IconName;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'>;

export const BubbleButton = ({ secondary, label, onClick, icon, className, ...props }: BubbleButtonProps) => (
	<button
		className={prependClassName(
			className,
			`rcx-box rcx-box--full rcx-bubble__button ${secondary ? 'rcx-bubble__button--secondary' : 'rcx-bubble__button--primary'}`,
		)}
		onClick={onClick}
		{...props}
	>
		{icon && <Icon name={icon} size='x16' />}
		{label && <span>{label}</span>}
	</button>
);
