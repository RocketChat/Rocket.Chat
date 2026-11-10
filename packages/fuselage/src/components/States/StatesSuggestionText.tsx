import type { ReactNode } from 'react';

import { ariaAndDataAttributes } from '../../helpers/ariaAndDataAttributes';
import { cx } from '../../helpers/composeClassNames';
import type { PartAttributes } from '../../types/ElementAttributes';

export type StatesSuggestionTextProps = PartAttributes<HTMLDivElement> & {
	children?: ReactNode;
};

const StatesSuggestionText = (props: StatesSuggestionTextProps) => (
	<div
		{...ariaAndDataAttributes(props)}
		ref={props.ref}
		id={props.id}
		title={props.title}
		className={cx('rcx-states__suggestion-text', props.className)}
	>
		{props.children}
	</div>
);

export default StatesSuggestionText;
