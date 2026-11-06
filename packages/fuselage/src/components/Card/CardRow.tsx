import type { AllHTMLAttributes, ReactNode } from 'react';

import { cx } from '../../helpers/composeClassNames';

export type CardRowProps = {
	children: ReactNode;
} & AllHTMLAttributes<HTMLElement>;

const CardRow = ({ children, className, ...props }: CardRowProps) => (
	<div {...props} className={cx('rcx-card__row', className)}>
		{children}
	</div>
);

export default CardRow;
