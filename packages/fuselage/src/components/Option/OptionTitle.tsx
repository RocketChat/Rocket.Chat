import { cx } from '../../helpers/composeClassNames';
import { ItemGroupHeader, ItemGroupTitle } from '../Item';
import type { ItemPartAttributes } from '../Item/types';

export type OptionTitleProps = ItemPartAttributes;

const OptionTitle = ({ children, className, ...props }: OptionTitleProps) => (
	<ItemGroupHeader {...props} inset='md' className={cx('rcx-option__title', className)}>
		<ItemGroupTitle>{children}</ItemGroupTitle>
	</ItemGroupHeader>
);

export default OptionTitle;
