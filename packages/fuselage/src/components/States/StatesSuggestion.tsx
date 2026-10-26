import type { ReactNode, AllHTMLAttributes } from 'react';

import { cx } from '../../helpers/composeClassNames';

export type StatesSuggestionProps = {
	children?: ReactNode;
} & AllHTMLAttributes<HTMLDivElement>;

const StatesSuggestion = ({ children, className, ...props }: StatesSuggestionProps) => (
	<div {...props} className={cx('rcx-states__suggestion', className)}>
		{children}
	</div>
);

export default StatesSuggestion;
