import type { ReactNode } from 'react';

import { cx } from '../../helpers/composeClassNames';
import { ItemGroupHeader, ItemGroupTitle } from '../Item';
import type { ItemPartAttributes } from '../Item/types';

export type OptionHeaderProps = {
	children: ReactNode;
} & Omit<ItemPartAttributes, 'role' | 'children'>;

/**
 * A group label inside an `Options` listbox. It is presentational, so the listbox only reports its options.
 */
const OptionHeader = ({ children, className, ...props }: OptionHeaderProps) => (
	<ItemGroupHeader {...props} is='li' role='presentation' inset='md' className={cx('rcx-option__header', className)}>
		<ItemGroupTitle>{children}</ItemGroupTitle>
	</ItemGroupHeader>
);

export default OptionHeader;
