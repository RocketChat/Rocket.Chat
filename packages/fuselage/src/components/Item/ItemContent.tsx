import type { AllHTMLAttributes, ElementType, RefAttributes } from 'react';

import { cx } from '../../helpers/composeClassNames';

export type ItemContentProps = {
	is?: ElementType;
} & Omit<AllHTMLAttributes<HTMLElement>, 'is'> &
	RefAttributes<HTMLElement>;

/**
 * The flexible, truncating column that holds the title and description, or one `ItemRow` per line.
 */
const ItemContent = ({ is: Component = 'div', className, ...props }: ItemContentProps) => (
	<Component {...props} className={cx('rcx-item__content', className)} />
);

export default ItemContent;
