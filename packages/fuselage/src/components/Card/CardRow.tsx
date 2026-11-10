import type { AllHTMLAttributes, ReactNode } from 'react';

export type CardRowProps = {
	children: ReactNode;
} & AllHTMLAttributes<HTMLElement>;

const CardRow = ({ children, ...props }: CardRowProps) => (
	<div className='rcx-card__row' {...props}>
		{children}
	</div>
);

export default CardRow;
