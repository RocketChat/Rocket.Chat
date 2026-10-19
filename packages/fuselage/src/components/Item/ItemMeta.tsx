import type { AllHTMLAttributes, ElementType, RefAttributes } from 'react';

import { cx, cxx } from '../../helpers/composeClassNames';

export type ItemMetaProps = {
	is?: ElementType;
	/**
	 * Lets longer trailing text, such as a command description, shrink and end in an ellipsis.
	 */
	truncate?: boolean;
} & Omit<AllHTMLAttributes<HTMLElement>, 'is'> &
	RefAttributes<HTMLElement>;

/**
 * Short trailing text, such as a timestamp, count or file size. It never truncates unless `truncate` is set.
 */
const ItemMeta = ({ is: Component = 'div', truncate, className, ...props }: ItemMetaProps) => (
	<Component {...props} className={cx(cxx('rcx-item__meta')({ truncate: !!truncate }), className)} />
);

export default ItemMeta;
