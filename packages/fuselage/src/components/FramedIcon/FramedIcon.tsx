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
} & Omit<AllHTMLAttributes<HTMLElement>, 'is'>;

const FramedIcon = ({ info, success, warning, danger, neutral, icon, ...props }: FramedIconProps) => (
	<Icon
		{...props}
		rcx-framed-icon
		rcx-framed-icon--info={info}
		rcx-framed-icon--success={success}
		rcx-framed-icon--warning={warning}
		rcx-framed-icon--danger={danger}
		rcx-framed-icon--neutral={neutral || (!info && !success && !warning && !danger)}
		name={icon}
		size={20}
	/>
);

export default FramedIcon;
