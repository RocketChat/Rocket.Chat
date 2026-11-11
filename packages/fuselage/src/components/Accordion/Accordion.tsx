import type { ReactNode } from 'react';

import { cx, cxx } from '../../helpers/composeClassNames';

export type AccordionProps = {
	children: ReactNode;
};

/**
 * An `Accordion` allows users to toggle the display of sections of content.
 */
const Accordion = ({ children }: AccordionProps) => (
	<div className={cx(cxx('rcx-box')('full', 'animated'), 'rcx-accordion')}>{children}</div>
);

export default Accordion;
