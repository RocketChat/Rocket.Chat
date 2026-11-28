import type { AllHTMLAttributes, ReactNode } from 'react';

import { cx } from '../../helpers/composeClassNames';

export type StatesProps = {
	children?: ReactNode;
} & AllHTMLAttributes<HTMLDivElement>;

const States = ({ children, className, ...props }: StatesProps) => (
	<div {...props} className={cx('rcx-states', className)}>
		{children}
	</div>
);

export default States;
