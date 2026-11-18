import { useResizeObserver } from '@rocket.chat/fuselage-hooks';
import type { ReactNode } from 'react';

import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';
import { Icon, type IconProps } from '../Icon';

export type CalloutProps = ElementProps<HTMLElement> & {
	/**
	 * Sets the border color and the default icon by what the callout reports: `success` when something important
	 * works as expected, `warning` when it needs attention, `danger` when it fails and needs urgent action.
	 */
	type?: 'info' | 'success' | 'warning' | 'danger';
	/** Shown above the description, on one line cut short with an ellipsis. */
	title?: ReactNode;
	children?: ReactNode;
	/** Replaces the icon `type` sets. */
	icon?: IconProps['name'];
	/** Buttons for what the user can do about it: beside the content from 420px wide, below it when narrower. */
	actions?: ReactNode;
};

const WRAPPER_LIMIT_SIZE = 420;

/**
 * Draws attention to something important about the content of the current page. It stays until its status changes:
 * the user can't dismiss it.
 */
const Callout = ({ type, title, children, icon, className, actions, ...props }: CalloutProps) => {
	const { ref, borderBoxSize } = useResizeObserver();
	const isLarge = borderBoxSize.inlineSize && borderBoxSize.inlineSize >= WRAPPER_LIMIT_SIZE;

	const defaultIcon =
		(type === 'info' && 'info-circled') ||
		(type === 'success' && 'checkmark-circled') ||
		(type === 'warning' && 'warning') ||
		(type === 'danger' && 'ban') ||
		'info-circled';

	return (
		<Box ref={ref} is='section' className={['rcx-callout', type && `rcx-callout--${type}`, className].filter(Boolean).join(' ')} {...props}>
			<Icon className='rcx-callout__icon' name={icon || defaultIcon} size='x20' />
			<Box rcx-callout__wrapper rcx-callout__wrapper--large={isLarge}>
				<Box rcx-callout__wrapper-content>
					{title && <Box rcx-callout__title>{title}</Box>}
					{children && <Box rcx-callout__content>{children}</Box>}
				</Box>
				{actions && <Box rcx-callout__actions>{actions}</Box>}
			</Box>
		</Box>
	);
};

export default Callout;
