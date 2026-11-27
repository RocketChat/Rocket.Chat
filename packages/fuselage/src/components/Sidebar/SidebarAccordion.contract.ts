import type { ReactNode } from 'react';

import type { ContainerContract } from '../../types/Container.contract';

export type SidebarAccordionContract = ContainerContract;

export type SidebarAccordionItemContract = ContainerContract & {
	title: ReactNode;
	/** Shown beside the title while the item is collapsed. */
	badge?: ReactNode;
	expanded?: boolean;
	defaultExpanded?: boolean;
	disabled?: boolean;
	/** Keeps the item open and its bar inert. */
	noncollapsible?: boolean;
};
