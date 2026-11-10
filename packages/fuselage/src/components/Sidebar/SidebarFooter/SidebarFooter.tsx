import type { HTMLAttributes } from 'react';

import { cx } from '../../../helpers/composeClassNames';

export const SidebarFooter = ({ children, className, ...props }: HTMLAttributes<HTMLElement>) => (
	<footer {...props} className={cx('rcx-sidebar-footer', className)}>
		{children}
	</footer>
);
