import type * as UiKit from '@rocket.chat/ui-kit';

/** Applies `default_to_current_conversation`: the element starts with the room the view was opened from when nothing else is selected. */
export const applyCurrentConversationDefault = <TElement extends UiKit.ActionableElement>(
	element: TElement,
	rid: string | undefined,
): TElement => {
	const actionable: UiKit.ActionableElement = element;

	if (!rid || !('default_to_current_conversation' in actionable) || !actionable.default_to_current_conversation) {
		return element;
	}

	if (actionable.type === 'conversations_select' && !actionable.initial_conversation) {
		return { ...element, initial_conversation: rid };
	}

	if (actionable.type === 'multi_conversations_select' && !actionable.initial_conversations?.length) {
		return { ...element, initial_conversations: [rid] };
	}

	return element;
};
