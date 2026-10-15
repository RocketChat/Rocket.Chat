import type { HTMLAttributes } from 'react';

import { appendClassName } from '../../../helpers/appendClassName';
import { patchChildren } from '../../../helpers/patchChildren';

export const SidebarItemMenu = ({ children, ...props }: HTMLAttributes<HTMLDivElement>) => (
	<div className='rcx-box rcx-box--full rcx-sidebar-item__menu-wrapper rcx-box--animated' {...props}>
		{patchChildren(
			<span className='rcx-box rcx-box--full rcx-sidebar-item__menu'>{children}</span>,
			(childProps: { className: string | string[] }) => ({
				className: appendClassName(childProps.className, 'rcx-sidebar-item__menu'),
			}),
		)}
	</div>
);
