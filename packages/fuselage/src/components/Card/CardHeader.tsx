import type { AllHTMLAttributes, ReactNode } from 'react';

export type CardHeaderProps = {
	children: ReactNode;
} & AllHTMLAttributes<HTMLElement>;

const CardHeader = ({ children, ...props }: CardHeaderProps) => (
	<div className='rcx-card__header' {...props}>
		{children}
	</div>
);

export default CardHeader;
