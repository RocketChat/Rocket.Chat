import type { AllHTMLAttributes, ReactNode } from 'react';

import { cx } from '../../helpers/composeClassNames';

export type StatesSubtitleProps = {
	children?: ReactNode;
} & AllHTMLAttributes<HTMLDivElement>;

const StatesSubtitle = ({ children, className, ...props }: StatesSubtitleProps) => (
	<div {...props} className={cx('rcx-states__subtitle', className)}>
		{children}
	</div>
);

export default StatesSubtitle;
