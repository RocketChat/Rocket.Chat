import type { HTMLAttributes } from 'react';

import { SidebarDivider } from './SidebarDivider';

export const SidebarSection = (props: HTMLAttributes<HTMLDivElement>) => (
	<div>
		<div className='rcx-box rcx-box--full rcx-sidebar-section' {...props} />
		<SidebarDivider />
	</div>
);
