import type { AllHTMLAttributes, ReactNode } from 'react';

import { cx } from '../../helpers/composeClassNames';

export type StatesSuggestionListProps = {
	children?: ReactNode;
} & AllHTMLAttributes<HTMLUListElement>;

const StatesSuggestionList = ({ children, className, ...props }: StatesSuggestionListProps) => (
	<ul {...props} className={cx('rcx-states__list', className)}>
		{children}
	</ul>
);

export default StatesSuggestionList;
