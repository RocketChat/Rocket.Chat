import type { AllHTMLAttributes, ReactNode } from 'react';

export type StatesSubtitleProps = {
	children?: ReactNode;
} & AllHTMLAttributes<HTMLDivElement>;

const StatesSubtitle = ({ children, ...props }: StatesSubtitleProps) => (
	<div {...props} className='rcx-states__subtitle'>
		{children}
	</div>
);

export default StatesSubtitle;
