import type { HTMLAttributes } from 'react';

import { cx } from '../../helpers/composeClassNames';
import { ItemContent, ItemTitle } from '../Item';

export type OptionContentProps = HTMLAttributes<HTMLDivElement>;

const OptionContent = ({ className, children, ...props }: OptionContentProps) => (
	<ItemContent {...(props as Omit<OptionContentProps, 'is'>)} className={cx('rcx-option__content', className)}>
		<ItemTitle>{children}</ItemTitle>
	</ItemContent>
);

export default OptionContent;
