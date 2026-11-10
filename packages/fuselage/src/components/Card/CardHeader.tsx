import type { AllHTMLAttributes, ReactNode } from 'react';

import { cx } from '../../helpers/composeClassNames';

export type CardHeaderProps = {
	children: ReactNode;
} & AllHTMLAttributes<HTMLElement>;

const CardHeader = ({ children, className, ...props }: CardHeaderProps) => (
	<div {...props} className={cx('rcx-card__header', className)}>
		{children}
	</div>
);

export default CardHeader;
