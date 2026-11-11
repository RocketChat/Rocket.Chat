import { cx } from '../../helpers/composeClassNames';
import { ItemContent, ItemTitle } from '../Item';
import type { ItemPartAttributes } from '../Item/types';

export type OptionContentProps = ItemPartAttributes;

const OptionContent = ({ className, children, ...props }: OptionContentProps) => (
	<ItemContent {...props} className={cx('rcx-option__content', className)}>
		<ItemTitle>{children}</ItemTitle>
	</ItemContent>
);

export default OptionContent;
