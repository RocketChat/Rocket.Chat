import type { HTMLAttributes } from 'react';

export type SidebarAccordionProps = HTMLAttributes<HTMLDivElement>;

const SidebarAccordion = ({ className, children, ...props }: SidebarAccordionProps) => (
	<div className={['rcx-box rcx-box--full rcx-sidebar-accordion rcx-box--animated', className].filter(Boolean).join(' ')} {...props}>
		<div className='rcx-sidebar-accordion__wrapper'>{children}</div>
	</div>
);

export default SidebarAccordion;
