import type { AllHTMLAttributes, ReactNode } from 'react';

import { cx } from '../../helpers/composeClassNames';

export type StatesSuggestionListItemProps = {
	children?: ReactNode;
} & AllHTMLAttributes<HTMLLIElement>;

const StatesSuggestionListItem = ({ children, className, ...props }: StatesSuggestionListItemProps) => (
	<li {...props} className={cx('rcx-states__list-item', className)}>
		<span className='rcx-states__list-item-wrapper'>{children}</span>
	</li>
);

export default StatesSuggestionListItem;
