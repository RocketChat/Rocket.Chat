import type { Keys as IconKeys } from '@rocket.chat/icons';
import { isValidElement, type ReactElement } from 'react';

import { cx } from '../../../helpers/composeClassNames.js';
import { Icon, type IconProps } from '../../Icon/index.js';
import { ItemIcon } from '../../Item/index.js';

export type SidebarItemIconProps = Omit<IconProps, 'name' | 'label'> & {
	icon: IconKeys | ReactElement<any>;
	highlighted?: boolean;
	/**
	 * Names what the icon conveys, such as "Private channel". Without it, the icon is decorative.
	 */
	label?: string;
};

export const SidebarItemIcon = ({ icon, className, highlighted, label, ...props }: SidebarItemIconProps) => (
	<ItemIcon
		label={label}
		className={cx(
			'rcx-sidebar-item__icon',
			!!highlighted && 'rcx-sidebar-item__icon--highlighted',
			typeof className === 'string' && className,
		)}
	>
		{isValidElement(icon) ? icon : <Icon name={icon as IconKeys} size='x20' {...props} />}
	</ItemIcon>
);
