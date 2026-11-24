import type * as UiKit from '@rocket.chat/ui-kit';
import { useLayoutEffect, useState } from 'react';

import { createUiKitViewState } from '../utils/createUiKitViewState';
import type { UiKitViewState } from '../utils/createUiKitViewState';

/**
 * The form state of a view rendered from `blocks`, for its surface to put on `UiKitContext` and read on submit and close.
 * `rid` is the room the view was opened from, for the elements that default to the current conversation.
 */
export const useUiKitViewState = (blocks: UiKit.LayoutBlock[], rid?: string): UiKitViewState => {
	const [viewState] = useState(() => createUiKitViewState(blocks, rid));

	useLayoutEffect(() => {
		viewState.reseed(blocks);
	}, [blocks, viewState]);

	return viewState;
};
