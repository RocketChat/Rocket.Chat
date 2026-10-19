import type { AllHTMLAttributes, ReactNode } from 'react';

export type StatesProps = {
	children?: ReactNode;
} & AllHTMLAttributes<HTMLDivElement>;

const States = ({ children, ...props }: StatesProps) => (
	<div {...props} className='rcx-states'>
		{children}
	</div>
);

export default States;
