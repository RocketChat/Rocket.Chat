import type { ReactNode } from 'react';

import { cx } from '../../helpers/composeClassNames';
import { ItemGroupHeader, ItemGroupTitle, type ItemGroupHeaderProps } from '../Item';

export type OptionHeaderProps = Omit<ItemGroupHeaderProps, 'is' | 'role' | 'inset' | 'children'> & {
	children: ReactNode;
};

/**
 * A group label inside an `Options` listbox. It is presentational, so the listbox only reports its options.
 */
const OptionHeader = ({ children, className, ...props }: OptionHeaderProps) => (
	<ItemGroupHeader {...props} is='li' role='presentation' inset='md' className={cx('rcx-option__header', className)}>
		<ItemGroupTitle>{children}</ItemGroupTitle>
	</ItemGroupHeader>
);

export default OptionHeader;
