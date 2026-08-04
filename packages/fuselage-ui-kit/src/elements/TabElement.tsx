import { TabsItem } from '@rocket.chat/fuselage';
import * as UiKit from '@rocket.chat/ui-kit';
import type { Dispatch } from 'react';

import { useUiKitState } from '../hooks/useUiKitState';
import type { BlockProps } from '../utils/BlockProps';

export const TabElement = ({
	block,
	context,
	surfaceRenderer,
	index,
	select,
}: BlockProps<UiKit.ExperimentalTabElement> & {
	select: Dispatch<number>;
}) => {
	const [{ loading }, action] = useUiKitState(block, context);

	const { title, selected, disabled } = block;

	return (
		<TabsItem
			selected={selected}
			disabled={loading ? true : disabled}
			onClick={(e) => {
				if (disabled) return;
				select(index);
				void action(e);
			}}
		>
			{surfaceRenderer.renderTextObject(title, 0, UiKit.BlockContext.NONE)}
		</TabsItem>
	);
};
