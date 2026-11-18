import type { ButtonHTMLAttributes } from 'react';

import { cx } from '../../../helpers/composeClassNames';

export type SidebarBannerButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'>;

/** The banner's action when it runs code instead of navigating. */
export const SidebarBannerButton = ({ className, ...props }: SidebarBannerButtonProps) => (
	<button
		type='button'
		className={cx('rcx-box rcx-box--full rcx-sidebar-banner__link rcx-sidebar-banner__link--button', className)}
		{...props}
	/>
);
