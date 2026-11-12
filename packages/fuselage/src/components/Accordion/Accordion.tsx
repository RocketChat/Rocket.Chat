import type { AriaAttributes, ReactNode } from 'react';

import { cx, cxx } from '../../helpers/composeClassNames';

export type AccordionProps = {
	children: ReactNode;
} & AriaAttributes & { [key: `data-${string}`]: string | undefined };

/**
 * An `Accordion` allows users to toggle the display of sections of content.
 */
const Accordion = ({ children, ...props }: AccordionProps) => (
	<div className={cx(cxx('rcx-box')('full', 'animated'), 'rcx-accordion')} {...props}>
		{children}
	</div>
);

export default Accordion;
