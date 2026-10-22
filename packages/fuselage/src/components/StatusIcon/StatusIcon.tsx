import type { Keys as IconName } from '@rocket.chat/icons';
import type { AllHTMLAttributes } from 'react';

import { Icon, type IconProps } from '../Icon';

export type StatusIconProps = {
	name: IconName;
	status: 'hint' | 'info' | 'danger' | 'warning' | 'success';
	size?: IconProps['size'];
} & Omit<AllHTMLAttributes<HTMLElement>, 'is' | 'size' | 'color'>;

/** An icon coloured by the status it reports, apart from the text beside it. */
const StatusIcon = ({ name, status, size, className, ...props }: StatusIconProps) => (
	<Icon {...props} className={[className, 'rcx-status-icon', `rcx-status-icon--${status}`]} name={name} size={size} />
);

export default StatusIcon;
