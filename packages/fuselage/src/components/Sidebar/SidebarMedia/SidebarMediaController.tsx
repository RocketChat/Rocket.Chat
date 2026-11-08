import type { HTMLAttributes } from 'react';

import { SidebarButtonGroup } from '../SidebarButtonGroup';

export const SidebarMediaController = ({ className, label, children, ...props }: { label?: string } & HTMLAttributes<HTMLDivElement>) => (
	<div className={['rcx-sidebar-media__controller', className].filter(Boolean).join(' ')}>
		<div className='rcx-sidebar-media__controller__label'>{label}</div>
		<SidebarButtonGroup small align='end' {...props}>
			{children}
		</SidebarButtonGroup>
	</div>
);
