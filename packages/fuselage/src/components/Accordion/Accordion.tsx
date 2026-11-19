import type { ReactNode } from 'react';

import { cx, cxx } from '../../helpers/composeClassNames';
import { StylingBox } from '../Box';
import type { StylingProps } from '../Box/stylingProps';

export type AccordionProps = {
	children: ReactNode;
} & Partial<StylingProps>;

/**
 * Groups related content into `AccordionItem` sections the user expands and collapses, so they can scan the titles
 * and decide where to look.
 */
const Accordion = ({ children, ...props }: AccordionProps) => (
	<StylingBox {...props}>
		<div className={cx(cxx('rcx-box')('full', 'animated'), 'rcx-accordion')}>{children}</div>
	</StylingBox>
);

export default Accordion;
