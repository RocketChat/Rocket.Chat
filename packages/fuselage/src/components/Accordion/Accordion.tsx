import type { ReactNode } from 'react';

import { cx, cxx } from '../../helpers/composeClassNames.js';
import { StylingBox } from '../Box/index.js';
import type { StylingProps } from '../Box/stylingProps.js';

export type AccordionProps = {
	children: ReactNode;
} & Partial<StylingProps>;

/**
 * An `Accordion` allows users to toggle the display of sections of content.
 */
const Accordion = ({ children, ...props }: AccordionProps) => (
	<StylingBox {...props}>
		<div className={cx(cxx('rcx-box')('full', 'animated'), 'rcx-accordion')}>{children}</div>
	</StylingBox>
);

export default Accordion;
