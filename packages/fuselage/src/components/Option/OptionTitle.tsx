import { cx } from '../../helpers/composeClassNames';
import { ItemGroupHeader, ItemGroupTitle, type ItemGroupHeaderProps } from '../Item';

export type OptionTitleProps = Omit<ItemGroupHeaderProps, 'is' | 'inset'>;

const OptionTitle = ({ children, className, ...props }: OptionTitleProps) => (
	<ItemGroupHeader {...props} inset='md' className={cx('rcx-option__title', className)}>
		<ItemGroupTitle>{children}</ItemGroupTitle>
	</ItemGroupHeader>
);

export default OptionTitle;
