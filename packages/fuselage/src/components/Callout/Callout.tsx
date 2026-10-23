import { useMergedRefs, useResizeObserver } from '@rocket.chat/fuselage-hooks';
import type { ReactNode } from 'react';

import { Box, type BoxProps } from '../Box';
import { Icon, type IconProps } from '../Icon';

export type CalloutProps = Omit<BoxProps, 'type' | 'name'> & {
	type?: 'info' | 'success' | 'warning' | 'danger';
	title?: ReactNode;
	children?: ReactNode;
	icon?: IconProps['name'];
	actions?: ReactNode;
};

const WRAPPER_LIMIT_SIZE = 420;

/**
 * The `Callout` is used to get the user's attention explaining something important in the content of the current page.
 */
const Callout = ({ ref, type, title, children, icon, className, actions, ...props }: CalloutProps) => {
	const { ref: resizeObserverRef, borderBoxSize } = useResizeObserver();
	const mergedRef = useMergedRefs(ref, resizeObserverRef);
	const isLarge = borderBoxSize.inlineSize && borderBoxSize.inlineSize >= WRAPPER_LIMIT_SIZE;

	const defaultIcon =
		(type === 'info' && 'info-circled') ||
		(type === 'success' && 'checkmark-circled') ||
		(type === 'warning' && 'warning') ||
		(type === 'danger' && 'ban') ||
		'info-circled';

	return (
		<Box ref={mergedRef} is='section' className={['rcx-callout', type && `rcx-callout--${type}`, className].filter(Boolean).join(' ')} {...props}>
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
