import type { AllHTMLAttributes, RefAttributes } from 'react';

import { IconButton } from '../Button';
import ItemActions from '../Item/ItemActions';

export type ToastBarCloseProps = {
	/**
	 * The accessible name of the button.
	 */
	label?: string;
	onClose: () => void;
} & Omit<AllHTMLAttributes<HTMLElement>, 'is' | 'label'> &
	RefAttributes<HTMLElement>;

/**
 * The button that dismisses the toast, after the message.
 */
const ToastBarClose = ({ label = 'Dismiss alert', onClose, ...props }: ToastBarCloseProps) => (
	<ItemActions {...props}>
		<IconButton size='mini' icon='cross' aria-label={label} onClick={onClose} />
	</ItemActions>
);

export default ToastBarClose;
