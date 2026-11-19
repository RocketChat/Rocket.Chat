import type { HTMLAttributes } from 'react';

import { cx } from '../../helpers/composeClassNames.js';
import { ItemContent, ItemTitle } from '../Item/index.js';

export type OptionContentProps = Omit<HTMLAttributes<HTMLDivElement>, 'is'>;

const OptionContent = ({ className, children, ...props }: OptionContentProps) => (
	<ItemContent {...props} className={cx('rcx-option__content', className)}>
		<ItemTitle>{children}</ItemTitle>
	</ItemContent>
);

export default OptionContent;
