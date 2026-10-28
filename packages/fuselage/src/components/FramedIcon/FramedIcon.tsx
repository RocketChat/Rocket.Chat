import type { Keys } from '@rocket.chat/icons';
import type { AllHTMLAttributes } from 'react';

import { Icon } from '../Icon';

export type FramedIconProps = {
	info?: boolean;
	success?: boolean;
	warning?: boolean;
	danger?: boolean;
	neutral?: boolean;
	icon: Keys;
} & Omit<AllHTMLAttributes<HTMLElement>, 'is' | 'color'>;

const FramedIcon = ({ info, success, warning, danger, neutral, icon, className, ...props }: FramedIconProps) => (
	<Icon
		{...props}
		className={[
			className,
			'rcx-framed-icon',
			info && 'rcx-framed-icon--info',
			success && 'rcx-framed-icon--success',
			warning && 'rcx-framed-icon--warning',
			danger && 'rcx-framed-icon--danger',
			(neutral || (!info && !success && !warning && !danger)) && 'rcx-framed-icon--neutral',
		]
			.filter(Boolean)
			.join(' ')}
		name={icon}
		size={20}
	/>
);

export default FramedIcon;
