import type { ReactNode } from 'react';

import { ariaAndDataAttributes } from '../../helpers/ariaAndDataAttributes';
import { cx } from '../../helpers/composeClassNames';
import { pickWebPressHandlers } from '../../helpers/pickAttributes';
import type { DivActionAttributes, DivRef } from '../../types/ElementAttributes';

export type SidepanelSectionActionProps = { children?: ReactNode } & DivActionAttributes;

const SidepanelSectionAction = (props: SidepanelSectionActionProps) => (
	<div
		{...ariaAndDataAttributes(props)}
		{...pickWebPressHandlers(props)}
		ref={props.ref as DivRef}
		id={props.id}
		title={props.title}
		role={props.role}
		tabIndex={props.tabIndex}
		className={cx('rcx-sidepanel-section__action', props.className)}
	>
		{props.children}
	</div>
);

export default SidepanelSectionAction;
