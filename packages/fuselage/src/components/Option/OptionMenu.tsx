import type { HTMLAttributes } from 'react';

import { cx } from '../../helpers/composeClassNames';
import { ItemActions } from '../Item';

export type OptionMenuProps = HTMLAttributes<HTMLDivElement>;

const OptionMenu = ({ className, ...props }: OptionMenuProps) => (
	<ItemActions {...(props as Omit<OptionMenuProps, 'is'>)} reveal='hover' className={cx('rcx-option__menu-wrapper', className)} />
);

export default OptionMenu;
