import type { ReactNode } from 'react';

import { ItemGroupHeader, ItemGroupTitle } from '../Item';

export type OptionTitleProps = {
	children?: ReactNode;
};

const OptionTitle = ({ children, ...props }: OptionTitleProps) => (
	<ItemGroupHeader {...props} inset='md' className='rcx-option__title'>
		<ItemGroupTitle>{children}</ItemGroupTitle>
	</ItemGroupHeader>
);

export default OptionTitle;
