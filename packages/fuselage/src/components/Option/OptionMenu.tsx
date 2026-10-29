import { cx } from '../../helpers/composeClassNames';
import { ItemActions, type ItemActionsProps } from '../Item';

export type OptionMenuProps = Omit<ItemActionsProps, 'reveal'>;

const OptionMenu = ({ className, ...props }: OptionMenuProps) => (
	<ItemActions {...props} reveal='hover' className={cx('rcx-option__menu-wrapper', className)} />
);

export default OptionMenu;
