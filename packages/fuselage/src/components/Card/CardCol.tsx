import type { AllHTMLAttributes, ReactNode } from 'react';

import { cx } from '../../helpers/composeClassNames';

export type CardColProps = {
	children: ReactNode;
} & AllHTMLAttributes<HTMLElement>;

const CardCol = ({ children, className, ...props }: CardColProps) => (
	<div {...props} className={cx('rcx-card__col', className)}>
		{children}
	</div>
);

export default CardCol;
