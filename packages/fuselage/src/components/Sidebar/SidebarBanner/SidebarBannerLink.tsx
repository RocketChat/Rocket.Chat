import type { AnchorHTMLAttributes } from 'react';

import { cx } from '../../../helpers/composeClassNames.js';

export type SidebarBannerLinkProps = AnchorHTMLAttributes<HTMLAnchorElement>;

/** The banner's action when it navigates. */
export const SidebarBannerLink = ({ className, children, ...props }: SidebarBannerLinkProps) => (
	<a className={cx('rcx-box rcx-box--full rcx-sidebar-banner__link', className)} {...props}>
		{children}
	</a>
);
