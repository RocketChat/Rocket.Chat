import type { AllHTMLAttributes, ReactNode } from 'react';

import { cx } from '../../helpers/composeClassNames';

export type CardHeaderProps = {
	children: ReactNode;
} & AllHTMLAttributes<HTMLElement>;

/** Row at the top of the card that lines up the `CardTitle` with an icon, avatar or tag. */
const CardHeader = ({ children, className, ...props }: CardHeaderProps) => (
	<div {...props} className={cx('rcx-card__header', className)}>
		{children}
	</div>
);

export default CardHeader;
