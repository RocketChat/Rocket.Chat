import type { AllHTMLAttributes, RefAttributes } from 'react';

import { useToastBarVariant } from './ToastBarContext';
import ItemContent from '../Item/ItemContent';

export type ToastBarMessageProps = Omit<AllHTMLAttributes<HTMLElement>, 'is'> & RefAttributes<HTMLElement>;

/**
 * The toast's content, announced politely, or assertively on an `error` surface.
 */
const ToastBarMessage = (props: ToastBarMessageProps) => {
	const variant = useToastBarVariant();

	return <ItemContent role={variant === 'error' ? 'alert' : 'status'} {...props} />;
};

export default ToastBarMessage;
