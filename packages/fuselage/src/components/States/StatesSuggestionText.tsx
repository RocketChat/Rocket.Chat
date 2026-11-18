import type { AllHTMLAttributes, ReactNode } from 'react';

import { cx } from '../../helpers/composeClassNames';

export type StatesSuggestionTextProps = {
	children?: ReactNode;
} & AllHTMLAttributes<HTMLDivElement>;

/** Introduces the `StatesSuggestionList`, such as "You can try to:". */
const StatesSuggestionText = ({ children, className, ...props }: StatesSuggestionTextProps) => (
	<div {...props} className={cx('rcx-states__suggestion-text', className)}>
		{children}
	</div>
);

export default StatesSuggestionText;
