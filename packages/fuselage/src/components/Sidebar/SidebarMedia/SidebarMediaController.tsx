import type { HTMLAttributes } from 'react';

import { SidebarButtonGroup } from '../SidebarButtonGroup';

/** A row of media controls, such as mute and hold, after a `label` naming what they control. */
export const SidebarMediaController = ({ className, label, children, ...props }: { label?: string } & HTMLAttributes<HTMLDivElement>) => (
	<div className={['rcx-sidebar-media__controller', className].filter(Boolean).join(' ')}>
		<div className='rcx-sidebar-media__controller__label'>{label}</div>
		<SidebarButtonGroup small align='end' {...props}>
			{children}
		</SidebarButtonGroup>
	</div>
);
