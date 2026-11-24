import type * as UiKit from '@rocket.chat/ui-kit';
import { useContext, useMemo } from 'react';

import { UiKitContext } from '../../../contexts/UiKitContext';
import { applyCurrentConversationDefault } from '../../../utils/applyCurrentConversationDefault';

type RoomSelectElement =
	UiKit.ChannelsSelectElement | UiKit.MultiChannelsSelectElement | UiKit.ConversationsSelectElement | UiKit.MultiConversationsSelectElement;

/** Applies `default_to_current_conversation` to the element, with the room the view was opened from. */
export const useCurrentConversationDefault = <TElement extends RoomSelectElement>(block: TElement): TElement => {
	const { rid } = useContext(UiKitContext);

	return useMemo(() => applyCurrentConversationDefault(block, rid), [block, rid]);
};
