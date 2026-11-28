import type { HTMLAttributes } from 'react';

import { SidebarDivider } from './SidebarDivider';
import { cx } from '../../helpers/composeClassNames';

export const SidebarSection = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
	<div>
		<div {...props} className={cx('rcx-box rcx-box--full rcx-sidebar-section', className)} />
		<SidebarDivider />
	</div>
);
