import type * as uikit from '@rocket.chat/ui-kit';
import type { ComponentChild } from 'preact';
import type { TargetedEvent } from 'preact/compat';
import { memo, useCallback } from 'preact/compat';

import { MenuGroup, MenuPopover } from '../../../Menu';
import { usePerformAction } from '../Block';
import OverflowOption from './OverflowOption';
import OverflowTrigger from './OverflowTrigger';

type OverflowElementProps = uikit.OverflowElement & {
	parser: uikit.SurfaceRenderer<ComponentChild>;
};

const OverflowElement = ({ actionId, confirm, options, parser }: OverflowElementProps) => {
	const [performAction, performingAction] = usePerformAction(actionId);

	const handleClick = useCallback(
		async (value: TargetedEvent<HTMLElement, MouseEvent>) => {
			await performAction({ value });
		},
		[performAction],
	);

	return (
		<MenuPopover trigger={({ pop }) => <OverflowTrigger loading={performingAction} onClick={pop} />}>
			<MenuGroup>
				{Array.isArray(options) &&
					options.map((option, i) => <OverflowOption key={i} {...option} confirm={confirm} parser={parser} onClick={handleClick} />)}
			</MenuGroup>
		</MenuPopover>
	);
};

export default memo(OverflowElement);
