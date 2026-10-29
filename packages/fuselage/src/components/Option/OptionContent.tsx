import { cx } from '../../helpers/composeClassNames';
import { ItemContent, ItemTitle, type ItemContentProps } from '../Item';

export type OptionContentProps = ItemContentProps;

const OptionContent = ({ className, children, ...props }: OptionContentProps) => (
	<ItemContent {...props} className={cx('rcx-option__content', className)}>
		<ItemTitle>{children}</ItemTitle>
	</ItemContent>
);

export default OptionContent;
