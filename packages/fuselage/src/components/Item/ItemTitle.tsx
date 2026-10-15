import type { AllHTMLAttributes, ElementType, RefAttributes } from 'react';

import { cx } from '../../helpers/composeClassNames';

export type ItemTitleProps = {
	is?: ElementType;
} & Omit<AllHTMLAttributes<HTMLElement>, 'is'> &
	RefAttributes<HTMLElement>;

/**
 * The main label of an `Item`. It truncates with an ellipsis.
 */
const ItemTitle = ({ is: Tag = 'div', className, ...props }: ItemTitleProps) => (
	<Tag {...props} className={cx('rcx-item__title', className)} />
);

export default ItemTitle;
