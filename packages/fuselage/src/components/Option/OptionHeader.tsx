import type { ReactNode } from 'react';

import { ItemGroupHeader, ItemGroupTitle } from '../Item';

export type OptionHeaderProps = {
	children: ReactNode;
};

/**
 * A group label inside an `Options` listbox. It is presentational, so the listbox only reports its options.
 */
const OptionHeader = ({ children }: OptionHeaderProps) => (
	<ItemGroupHeader is='li' role='presentation' inset='md' className='rcx-option__header'>
		<ItemGroupTitle>{children}</ItemGroupTitle>
	</ItemGroupHeader>
);

export default OptionHeader;
