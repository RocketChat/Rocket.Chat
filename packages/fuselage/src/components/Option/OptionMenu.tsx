import type { HTMLAttributes } from 'react';

import { cx } from '../../helpers/composeClassNames.js';
import { ItemActions } from '../Item/index.js';

export type OptionMenuProps = Omit<HTMLAttributes<HTMLDivElement>, 'is'>;

const OptionMenu = ({ className, ...props }: OptionMenuProps) => (
	<ItemActions {...props} reveal='hover' className={cx('rcx-option__menu-wrapper', className)} />
);

export default OptionMenu;
