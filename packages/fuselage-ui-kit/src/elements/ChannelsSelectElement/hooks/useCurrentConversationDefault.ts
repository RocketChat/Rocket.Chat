import type * as UiKit from '@rocket.chat/ui-kit';
import { useContext, useEffect, useMemo } from 'react';

import { UiKitContext } from '../../../contexts/UiKitContext';

type RoomSelectElement =
	UiKit.ChannelsSelectElement | UiKit.MultiChannelsSelectElement | UiKit.ConversationsSelectElement | UiKit.MultiConversationsSelectElement;

/** Applies `default_to_current_conversation`: preselects the room the view was opened from, in the element and in the view state. */
export const useCurrentConversationDefault = <TElement extends RoomSelectElement>(block: TElement): TElement => {
	const { rid, updateState, appId, viewId } = useContext(UiKitContext);

	const current = useMemo(() => {
		if (!rid) {
			return undefined;
		}

		if (block.type === 'conversations_select' && block.default_to_current_conversation && !block.initial_conversation) {
			return { initial_conversation: rid, value: rid };
		}

		if (block.type === 'multi_conversations_select' && block.default_to_current_conversation && !block.initial_conversations?.length) {
			return { initial_conversations: [rid], value: [rid] };
		}

		return undefined;
	}, [block, rid]);

	useEffect(() => {
		if (!current) {
			return;
		}

		void updateState?.(
			{ blockId: block.blockId, appId: block.appId || appId || 'core', actionId: block.actionId, value: current.value, viewId },
			undefined as never,
		);
		// Seed the view state once, when the element mounts.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return useMemo(() => {
		if (!current) {
			return block;
		}

		const { value: _value, ...initialSelection } = current;
		return { ...block, ...initialSelection };
	}, [block, current]);
};
