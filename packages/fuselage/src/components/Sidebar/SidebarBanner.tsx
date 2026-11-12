import type { AllHTMLAttributes, MouseEventHandler, ReactNode } from 'react';

import { cx } from '../../helpers/composeClassNames';
import { IconButton } from '../Button';

export type SidebarBannerVariant = 'default' | 'info' | 'success' | 'warning' | 'danger';

export type SidebarBannerProps = {
	title?: ReactNode;
	linkText?: string;
	/** With an `href` the action is a link; without one it is a button, so it is activated from the keyboard. */
	linkProps?: Omit<AllHTMLAttributes<HTMLAnchorElement>, 'onClick'> & { onClick?: MouseEventHandler<HTMLElement> };
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
	linkText,
	linkProps,
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
			{linkText &&
				(linkProps?.href ? (
					<a className='rcx-box rcx-box--full rcx-sidebar-banner__link' {...linkProps}>
						{linkText}
					</a>
				) : (
					<button
						type='button'
						className='rcx-box rcx-box--full rcx-sidebar-banner__link'
						id={linkProps?.id}
						title={linkProps?.title}
						tabIndex={linkProps?.tabIndex}
						onClick={linkProps?.onClick}
					>
						{linkText}
					</button>
				))}
			{children}
		</div>
		<div className='rcx-box rcx-box--full rcx-sidebar-banner__addon'>
			{addon}
			{onClose && <IconButton aria-label={closeLabel} onClick={onClose} size='tiny' icon='cross' />}
		</div>
	</div>
);
