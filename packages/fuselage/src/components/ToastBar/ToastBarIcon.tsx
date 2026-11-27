import type { AllHTMLAttributes, RefAttributes } from 'react';

import { useToastBarVariant } from './ToastBarContext';
import { cx } from '../../helpers/composeClassNames';
import { Icon } from '../Icon';
import ItemMedia from '../Item/ItemMedia';

const iconNames = {
	info: 'info',
	success: 'circle-check',
	error: 'ban',
} as const;

export type ToastBarIconProps = Omit<AllHTMLAttributes<HTMLElement>, 'is'> & RefAttributes<HTMLElement>;

/**
 * The icon of the surface's variant, placed before the message.
 */
const ToastBarIcon = ({ className, ...props }: ToastBarIconProps) => {
	const variant = useToastBarVariant() ?? 'info';

	return (
		<ItemMedia {...props} variant='icon' className={cx(`rcx-toastbar__icon--${variant}`, className)}>
			<Icon size='x20' name={iconNames[variant]} />
		</ItemMedia>
	);
};

export default ToastBarIcon;
