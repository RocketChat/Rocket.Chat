import type { IMessage } from '@rocket.chat/core-typings';
import type { KeyboardEvent, MouseEvent } from 'react';

import { useIsMessageSelected, useIsSelectingMessages, useToggleMessageSelection } from '../contexts/MessageSelectionContext';

/**
 * Selection-mode behavior of a message row: while selecting, a click or Space/Enter on the row toggles it. The click stays on
 * the row, so the contextual bar the selection is made from does not close.
 */
export const useSelectableMessage = (messageId: IMessage['_id']) => {
	const isSelecting = useIsSelectingMessages();
	const isSelected = useIsMessageSelected(messageId);
	const toggleSelected = useToggleMessageSelection(messageId);

	const onClick = (event: MouseEvent<HTMLElement>) => {
		event.stopPropagation();
		toggleSelected();
	};

	const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
		if (!isSelecting || !(event.code === 'Space' || event.code === 'Enter')) {
			return;
		}

		event.preventDefault();
		toggleSelected();
	};

	return {
		isSelecting,
		isSelected,
		toggleSelected,
		rowProps: { onClick: isSelecting ? onClick : undefined, onKeyDown },
	};
};
