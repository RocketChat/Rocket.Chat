import type { ReactNode } from 'react';

import { ariaAndDataAttributes } from '../../helpers/ariaAndDataAttributes';
import { cx } from '../../helpers/composeClassNames';
import type { PartAttributes } from '../../types/ElementAttributes';

export type SidepanelListItemProps = {
	children?: ReactNode;
} & PartAttributes<HTMLDivElement>;

function SidepanelListItem(props: SidepanelListItemProps) {
	return (
		<div
			{...ariaAndDataAttributes(props)}
			ref={props.ref}
			id={props.id}
			title={props.title}
			role='listitem'
			className={cx('rcx-sidepanel-list__item', props.className)}
		>
			{props.children}
		</div>
	);
}

export default SidepanelListItem;
