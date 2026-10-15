import type { AllHTMLAttributes, ElementType, RefAttributes } from 'react';

import { cx } from '../../helpers/composeClassNames';

export type ItemMetaProps = {
	is?: ElementType;
} & Omit<AllHTMLAttributes<HTMLElement>, 'is'> &
	RefAttributes<HTMLElement>;

/**
 * Short trailing text that never truncates, such as a timestamp, count or file size.
 */
const ItemMeta = ({ is: Tag = 'div', className, ...props }: ItemMetaProps) => (
	<Tag {...props} className={cx('rcx-item__meta', className)} />
);

export default ItemMeta;
