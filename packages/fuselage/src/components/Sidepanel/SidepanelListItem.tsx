import type { ReactNode } from 'react';

import { ariaAndDataAttributes } from '../../helpers/ariaAndDataAttributes';
import { cx } from '../../helpers/composeClassNames';
import { pickVirtualizerStyle, pickWebPressHandlers } from '../../helpers/pickAttributes';
import type { DivActionAttributes, DivRef, VirtualizedItemAttributes } from '../../types/ElementAttributes';

export type SidepanelListItemProps = { children?: ReactNode } & DivActionAttributes & VirtualizedItemAttributes;

function SidepanelListItem(props: SidepanelListItemProps) {
	return (
		<div
			{...ariaAndDataAttributes(props)}
			{...pickWebPressHandlers(props)}
			{...pickVirtualizerStyle(props)}
			ref={props.ref as DivRef}
			id={props.id}
			title={props.title}
			tabIndex={props.tabIndex}
			role={props.role ?? 'listitem'}
			className={cx('rcx-sidepanel-list__item', props.className)}
		>
			{props.children}
		</div>
	);
}

export default SidepanelListItem;
