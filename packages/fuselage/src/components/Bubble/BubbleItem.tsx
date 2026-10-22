import type { Keys as IconName } from '@rocket.chat/icons';
import type { HTMLAttributes, ReactNode } from 'react';

import { Icon } from '../Icon';

type BubbleItemProps = {
	label?: ReactNode;
	secondary?: boolean;
	icon?: IconName;
} & HTMLAttributes<HTMLSpanElement>;

export const BubbleItem = ({ secondary, label, icon, ...props }: BubbleItemProps) => (
	<span className={`rcx-bubble__item ${secondary ? 'rcx-bubble__item--secondary' : 'rcx-bubble__item--primary'}`} {...props}>
		{icon && <Icon name={icon} size='x16' />}
		{label && <span>{label}</span>}
	</span>
);
