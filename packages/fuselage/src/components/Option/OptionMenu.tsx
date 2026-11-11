import { cx } from '../../helpers/composeClassNames';
import { ItemActions, type ItemActionsProps } from '../Item';
import { wrapText } from '../Item/wrapText';

export type OptionMenuProps = Omit<ItemActionsProps, 'reveal' | 'justify'>;

const OptionMenu = ({ className, children, ...props }: OptionMenuProps) => (
	<ItemActions {...props} reveal='hover' className={cx('rcx-option__menu-wrapper', className)}>
		{wrapText(children)}
	</ItemActions>
);

export default OptionMenu;
