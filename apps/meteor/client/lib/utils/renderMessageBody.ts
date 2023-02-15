import type { IMessage } from '@rocket.chat/core-typings';
import { escapeHTML } from '@rocket.chat/string-helpers';

import { callbacks } from '../../../lib/callbacks';

export const renderMessageBody = <
	T extends Partial<IMessage> & { tokens?: { token: string; text: string }[]; html?: string; actionContext?: string },
>(
	message: T,
): string => {
	message.html = message.msg?.trim() ? escapeHTML(message.msg.trim()) : '';
	const isSearchMessage = message?.actionContext === 'search';
	const { tokens, html } = callbacks.run('renderMessage', message, isSearchMessage);

	return (Array.isArray(tokens) ? tokens.reverse() : []).reduce((html, { token, text }) => html.replace(token, () => text), html ?? '');
};
