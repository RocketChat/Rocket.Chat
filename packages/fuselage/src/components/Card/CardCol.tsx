import type { AllHTMLAttributes, ReactNode } from 'react';

export type CardColProps = {
	children: ReactNode;
} & AllHTMLAttributes<HTMLElement>;

const CardCol = ({ children, ...props }: CardColProps) => (
	<div className='rcx-card__col' {...props}>
		{children}
	</div>
);

export default CardCol;
