import type { HTMLAttributes, ReactNode } from 'react';

import { cx } from '../../helpers/composeClassNames.js';
import { ItemGroupHeader, ItemGroupTitle } from '../Item/index.js';

export type OptionHeaderProps = {
	children: ReactNode;
} & Omit<HTMLAttributes<HTMLLIElement>, 'is' | 'role'>;

/**
 * A group label inside an `Options` listbox. It is presentational, so the listbox only reports its options.
 */
const OptionHeader = ({ children, className, ...props }: OptionHeaderProps) => (
	<ItemGroupHeader {...props} is='li' role='presentation' inset='md' className={cx('rcx-option__header', className)}>
		<ItemGroupTitle>{children}</ItemGroupTitle>
	</ItemGroupHeader>
);

export default OptionHeader;
