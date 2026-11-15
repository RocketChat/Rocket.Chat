import type { AllHTMLAttributes, ReactNode } from 'react';

import { cx } from '../../helpers/composeClassNames';
import { IconButton } from '../Button';

export type SidebarBannerVariant = 'default' | 'info' | 'success' | 'warning' | 'danger';

export type SidebarBannerProps = {
	title?: ReactNode;
	linkText?: string;
	linkProps?: AllHTMLAttributes<HTMLAnchorElement>;
	onClick?: () => void;
	variant?: SidebarBannerVariant;
	onClose?: () => void;
	children?: ReactNode;
	addon?: ReactNode;
	className?: string;
};

export const SidebarBanner = ({
	title,
	linkText,
	linkProps,
	variant = 'default',
	addon,
	onClose,
	children,
	className,
	...props
}: SidebarBannerProps) => (
	<div {...props} className={cx('rcx-box rcx-box--full rcx-sidebar-banner', `rcx-sidebar-banner--${variant}`, className)}>
		<div className='rcx-box rcx-box--full rcx-sidebar-banner__content'>
			{title && <h5 className='rcx-box rcx-box--full rcx-sidebar-banner__title'>{title}</h5>}
			{linkText && (
				<a className='rcx-box rcx-box--full rcx-sidebar-banner__link' {...linkProps}>
					{linkText}
				</a>
			)}
			{children}
		</div>
		<div className='rcx-box rcx-box--full rcx-sidebar-banner__addon'>
			{addon}
			{onClose && <IconButton onClick={onClose} size='tiny' icon='cross' />}
		</div>
	</div>
);
