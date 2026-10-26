import type { HTMLAttributes, ReactNode } from 'react';

import { cx } from '../../helpers/composeClassNames';
import { ItemGroupHeader, ItemGroupTitle } from '../Item';

export type OptionTitleProps = {
	children?: ReactNode;
} & HTMLAttributes<HTMLDivElement>;

const OptionTitle = ({ children, className, ...props }: OptionTitleProps) => (
	<ItemGroupHeader {...(props as Omit<OptionTitleProps, 'is'>)} inset='md' className={cx('rcx-option__title', className)}>
		<ItemGroupTitle>{children}</ItemGroupTitle>
	</ItemGroupHeader>
);

export default OptionTitle;
