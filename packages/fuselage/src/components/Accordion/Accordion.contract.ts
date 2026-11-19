import type { AriaAttributes, ReactNode } from 'react';

import type { CommonAttributes } from '../../types/Attributes.contract';

export type AccordionContract = CommonAttributes &
	Pick<AriaAttributes, 'aria-label' | 'aria-labelledby' | 'aria-describedby' | 'aria-hidden'> & {
		children: ReactNode;
	};

export type AccordionItemContract = CommonAttributes &
	Pick<AriaAttributes, 'aria-label' | 'aria-labelledby' | 'aria-describedby' | 'aria-hidden'> & {
		children?: ReactNode;
		defaultExpanded?: boolean;
		disabled?: boolean;
		expanded?: boolean;
		tabIndex?: number;
		title: ReactNode;
		noncollapsible?: boolean;
		onToggle?: (expanded: boolean) => void;
	};
