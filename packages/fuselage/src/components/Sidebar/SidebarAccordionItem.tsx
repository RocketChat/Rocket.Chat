import type { HTMLAttributes, ReactNode } from 'react';

import { Chevron } from '../Chevron';
import { useCollapse } from './hooks/useCollapse';

export type SidebarAccordionItemProps = {
	children?: ReactNode;
	className?: string;
	defaultExpanded?: boolean;
	disabled?: boolean;
	expanded?: boolean;
	title: ReactNode;
	noncollapsible?: boolean;
	badge?: ReactNode;
} & HTMLAttributes<HTMLElement>;

const SidebarAccordionItem = ({
	children,
	title,
	badge,
	noncollapsible,
	disabled,
	expanded: propExpanded,
	defaultExpanded,
	tabIndex,
	...props
}: SidebarAccordionItemProps) => {
	const { barProps, expanded, panelExpanded, panelId, titleId } = useCollapse({
		expanded: propExpanded,
		defaultExpanded,
		tabIndex,
		disabled,
		noncollapsible,
	});

	return (
		<section className='rcx-box rcx-box--full rcx-sidebar-accordion-item' {...props}>
			<div
				role='button'
				className={[
					'rcx-box rcx-box--full rcx-sidebar-accordion-item__bar rcx-box--animated',
					disabled && 'rcx-sidebar-accordion-item__bar--disabled',
				]
					.filter(Boolean)
					.join(' ')}
				{...barProps}
			>
				{!noncollapsible && <Chevron className='rcx-sidebar-accordion-item__chevron' size='x16' right={!expanded} />}
				{title && (
					<h5 className='rcx-sidebar-accordion-item__title' id={titleId}>
						{title}
					</h5>
				)}
				{!expanded && badge && badge}
			</div>
			<div
				className={[
					'rcx-sidebar-accordion-item__panel',
					'rcx-box--animated',
					panelExpanded && 'rcx-sidebar-accordion-item__panel--expanded',
				]
					.filter(Boolean)
					.join(' ')}
				id={panelId}
			>
				{children}
			</div>
		</section>
	);
};

export default SidebarAccordionItem;
