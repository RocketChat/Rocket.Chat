import type { AllHTMLAttributes, ReactNode } from 'react';

import { prependClassName } from '../../helpers/prependClassName';

export type CardHeaderProps = {
	children: ReactNode;
} & AllHTMLAttributes<HTMLElement>;

const CardHeader = ({ children, className, ...props }: CardHeaderProps) => (
	<div className={prependClassName(className, 'rcx-card__header')} {...props}>
		{children}
	</div>
);

export default CardHeader;
