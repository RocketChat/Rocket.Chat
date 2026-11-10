import type { ReactNode, AllHTMLAttributes } from 'react';

export type StatesSuggestionProps = {
	children?: ReactNode;
} & AllHTMLAttributes<HTMLDivElement>;

const StatesSuggestion = ({ children, ...props }: StatesSuggestionProps) => (
	<div {...props} className='rcx-states__suggestion'>
		{children}
	</div>
);

export default StatesSuggestion;
