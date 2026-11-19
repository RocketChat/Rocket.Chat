import type { Keys } from '@rocket.chat/icons';
import type { AllHTMLAttributes } from 'react';

import { Icon, type IconProps } from '../Icon';

export type FramedIconProps = {
	info?: boolean;
	success?: boolean;
	warning?: boolean;
	danger?: boolean;
	/** The color used when no other is set. */
	neutral?: boolean;
	icon: Keys;
	size?: IconProps['size'];
} & Omit<AllHTMLAttributes<HTMLElement>, 'is' | 'color' | 'size'>;

/** An icon in a tinted frame, next to the text it illustrates, to signal a state such as success or danger. */
const FramedIcon = ({ info, success, warning, danger, neutral, icon, size = 20, className, ...props }: FramedIconProps) => (
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
		size={size}
	/>
);

export default FramedIcon;
