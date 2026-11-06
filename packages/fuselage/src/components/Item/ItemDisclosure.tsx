import type { ButtonHTMLAttributes, RefAttributes } from 'react';

import { cx, cxx } from '../../helpers/composeClassNames';
import { Icon } from '../Icon';

export type ItemDisclosureProps = {
	expanded: boolean;
	/**
	 * Names the sub-list the button shows and hides, such as "Engineering rooms".
	 */
	label: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-expanded' | 'aria-label' | 'children' | 'type'> &
	RefAttributes<HTMLButtonElement>;

/**
 * The chevron that shows and hides a row's sub-list. It leads the row, before the media, and sits beside the
 * `ItemLink`, so the row still opens its target. Point `aria-controls` at the nested `ItemGroup`.
 */
const ItemDisclosure = ({ expanded, label, className, ...props }: ItemDisclosureProps) => (
	<button
		type='button'
		{...props}
		aria-expanded={expanded}
		aria-label={label}
		className={cx(cxx('rcx-item__disclosure')({ collapsed: !expanded }), className)}
	>
		<Icon name='chevron-down' size='x16' />
	</button>
);

export default ItemDisclosure;
