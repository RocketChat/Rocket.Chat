import type { ReactNode } from 'react';

import { ariaAndDataAttributes } from '../../../helpers/ariaAndDataAttributes';
import { cx } from '../../../helpers/composeClassNames';
import type { PartAttributes } from '../../../types/ElementAttributes';

type SidebarListItemProps = {
	children?: ReactNode;
} & PartAttributes<HTMLDivElement>;

export function SidebarListItem(props: SidebarListItemProps) {
	return (
		<div
			{...ariaAndDataAttributes(props)}
			ref={props.ref}
			id={props.id}
			title={props.title}
			role='listitem'
			className={cx('rcx-box rcx-box--full rcx-sidebar-item__list-item', props.className)}
		>
			{props.children}
		</div>
	);
}
