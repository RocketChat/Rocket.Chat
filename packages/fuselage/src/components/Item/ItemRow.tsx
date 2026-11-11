import type { AllHTMLAttributes, ElementType, RefAttributes } from 'react';

import { cx } from '../../helpers/composeClassNames';

export type ItemRowProps = {
	is?: ElementType;
} & Omit<AllHTMLAttributes<HTMLElement>, 'is'> &
	RefAttributes<HTMLElement>;

/**
 * A horizontal line inside `ItemContent`, such as a title with a timestamp or a description with a badge.
 */
const ItemRow = ({ is: Tag = 'div', className, ...props }: ItemRowProps) => <Tag {...props} className={cx('rcx-item__row', className)} />;

export default ItemRow;
