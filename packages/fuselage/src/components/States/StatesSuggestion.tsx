import type { ReactNode, AllHTMLAttributes } from 'react';

import { cx } from '../../helpers/composeClassNames';

export type StatesSuggestionProps = {
	children?: ReactNode;
} & AllHTMLAttributes<HTMLDivElement>;

/** Holds suggestions of what to try next: a `StatesSuggestionText` and a `StatesSuggestionList`. */
const StatesSuggestion = ({ children, className, ...props }: StatesSuggestionProps) => (
	<div {...props} className={cx('rcx-states__suggestion', className)}>
		{children}
	</div>
);

export default StatesSuggestion;
