import type { AllHTMLAttributes, ReactNode } from 'react';

import { cx } from '../../helpers/composeClassNames';

export type StatesTitleProps = {
	children?: ReactNode;
} & AllHTMLAttributes<HTMLHeadingElement>;

const StatesTitle = ({ children, className, ...props }: StatesTitleProps) => (
	<h3 {...props} className={cx('rcx-states__title', className)}>
		{children}
	</h3>
);

export default StatesTitle;
