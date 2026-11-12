import type { ReactNode } from 'react';

import { ariaAndDataAttributes } from '../../helpers/ariaAndDataAttributes';
import { cx, cxx } from '../../helpers/composeClassNames';

export type AccordionProps = {
	children: ReactNode;
};

/**
 * An `Accordion` allows users to toggle the display of sections of content.
 */
const Accordion = (props: AccordionProps) => (
	<div className={cx(cxx('rcx-box')('full', 'animated'), 'rcx-accordion')} {...ariaAndDataAttributes(props)}>
		{props.children}
	</div>
);

export default Accordion;
