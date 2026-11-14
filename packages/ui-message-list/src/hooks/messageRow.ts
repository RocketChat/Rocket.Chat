export const messageRowSelector = '.rcx-message[tabindex="0"], .rcx-message-system[tabindex="0"]';

export const isMessageRow = (node: Element) => node.matches(messageRowSelector);
