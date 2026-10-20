import { useItemListNavigation } from './useItemListNavigation';

export const messageRowSelector = '.rcx-message[tabindex="0"], .rcx-message-system[tabindex="0"]';

export const isMessageRow = (node: Element) => node.matches(messageRowSelector);

/**
 * Gives the lists whose rows are messages, such as the pinned, starred and mentions lists, the keyboard model of the other lists:
 * each message is a row, and its links, buttons and toolbar are the stops of Tab and of the left and right arrows.
 */
export const useMessageRowListNavigation = () => useItemListNavigation({ isItem: isMessageRow, rowSelector: messageRowSelector });
