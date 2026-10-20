import type { Keys as IconKeys } from '@rocket.chat/icons';
import { isValidElement, type ReactElement } from 'react';

import { useSidebarHighlight } from './useSidebarHighlight';
import { cx } from '../../../helpers/composeClassNames';
import { Icon, type IconProps } from '../../Icon';
import { ItemIcon } from '../../Item';

export type SidebarItemIconProps = Omit<IconProps, 'name' | 'label'> & {
	icon: IconKeys | ReactElement<any>;
	highlighted?: boolean;
	/**
	 * Names what the icon conveys, such as "Private channel". Without it, the icon is decorative.
	 */
	label?: string;
};

export const SidebarItemIcon = ({ icon, className, highlighted, label, ...props }: SidebarItemIconProps) => {
	const { wrapPart, wrapChildren } = useSidebarHighlight(highlighted);

	return wrapPart(
		<ItemIcon
			label={label}
			className={cx(
				'rcx-sidebar-item__icon',
				!!highlighted && 'rcx-sidebar-item__icon--highlighted',
				typeof className === 'string' && className,
			)}
		>
			{wrapChildren(isValidElement(icon) ? icon : <Icon name={icon as IconKeys} size='x20' {...props} />)}
		</ItemIcon>,
	);
};
