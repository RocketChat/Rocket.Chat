import type { ReactNode } from 'react';

import { ariaAndDataAttributes } from '../../../helpers/ariaAndDataAttributes';
import { cx } from '../../../helpers/composeClassNames';
import { pickWebPressHandlers } from '../../../helpers/pickAttributes';
import type { DivActionAttributes, DivRef } from '../../../types/ElementAttributes';

export type SidebarListItemProps = { children?: ReactNode } & DivActionAttributes;

export function SidebarListItem(props: SidebarListItemProps) {
	const { className, children } = props;

	return (
		<div
			{...ariaAndDataAttributes(props)}
			{...pickWebPressHandlers(props)}
			ref={props.ref as DivRef}
			id={props.id}
			title={props.title}
			tabIndex={props.tabIndex}
			role={props.role ?? 'listitem'}
			className={cx('rcx-box rcx-box--full rcx-sidebar-item__list-item', className)}
		>
			{children}
		</div>
	);
}
