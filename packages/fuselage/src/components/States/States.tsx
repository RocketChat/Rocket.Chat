import type { AllHTMLAttributes, ReactNode } from 'react';

import { cx } from '../../helpers/composeClassNames';

export type StatesProps = {
	children?: ReactNode;
} & AllHTMLAttributes<HTMLDivElement>;

/**
 * Fills a list or view that has nothing to show, such as no search results or a failed load, and says what the user
 * can do next.
 */
const States = ({ children, className, ...props }: StatesProps) => (
	<div {...props} className={cx('rcx-states', className)}>
		{children}
	</div>
);

export default States;
