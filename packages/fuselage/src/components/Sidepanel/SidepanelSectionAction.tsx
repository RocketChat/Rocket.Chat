import type { ReactNode } from 'react';

import { ariaAndDataAttributes } from '../../helpers/ariaAndDataAttributes';
import { cx } from '../../helpers/composeClassNames';
import type { PartAttributes } from '../../types/ElementAttributes';

export type SidepanelSectionActionProps = {
	children?: ReactNode;
} & PartAttributes<HTMLDivElement>;

const SidepanelSectionAction = (props: SidepanelSectionActionProps) => (
	<div
		{...ariaAndDataAttributes(props)}
		ref={props.ref}
		id={props.id}
		title={props.title}
		className={cx('rcx-sidepanel-section__action', props.className)}
	>
		{props.children}
	</div>
);

export default SidepanelSectionAction;
