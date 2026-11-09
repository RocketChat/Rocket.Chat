import type { ReactNode } from 'react';

import { cx } from '../../../helpers/composeClassNames.js';
import { IconButton } from '../../Button/index.js';

export type SidebarBannerVariant = 'default' | 'info' | 'success' | 'warning' | 'danger';

export type SidebarBannerProps = {
	title?: ReactNode;
	onClick?: () => void;
	variant?: SidebarBannerVariant;
	onClose?: () => void;
	closeLabel?: string;
	children?: ReactNode;
	addon?: ReactNode;
	className?: string;
};

export const SidebarBanner = ({
	title,
	variant = 'default',
	addon,
	onClose,
	closeLabel = 'Close',
	children,
	className,
	...props
}: SidebarBannerProps) => (
	<div {...props} className={cx('rcx-box rcx-box--full rcx-sidebar-banner', `rcx-sidebar-banner--${variant}`, className)}>
		<div className='rcx-box rcx-box--full rcx-sidebar-banner__content'>
			{title && <h5 className='rcx-box rcx-box--full rcx-sidebar-banner__title'>{title}</h5>}
			{children}
		</div>
		<div className='rcx-box rcx-box--full rcx-sidebar-banner__addon'>
			{addon}
			{onClose && <IconButton aria-label={closeLabel} onClick={onClose} size='tiny' icon='cross' />}
		</div>
	</div>
);
