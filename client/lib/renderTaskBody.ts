import { escapeHTML } from '@rocket.chat/string-helpers';

import { callbacks } from '../../app/callbacks/lib/callbacks';
import { ITask } from '../../definition/ITask';

export const renderTaskBody = <T extends Partial<ITask> & { html?: string }>(task: T): string => {
	task.html = task.title?.trim() ? escapeHTML(task.title.trim()) : '';
	const { tokens, html } = callbacks.run('renderMessage', task);

	return (Array.isArray(tokens) ? tokens.reverse() : []).reduce(
		(html, { token, text }) => html.replace(token, () => text),
		html,
	);
};

export const renderMessageBody = <T extends Partial<IMessage> & { html?: string }>(
	message: T,
): string => {
	message.html = message.msg?.trim() ? escapeHTML(message.msg.trim()) : '';
	const { tokens, html } = callbacks.run('renderMessage', message);

	return (Array.isArray(tokens) ? tokens.reverse() : []).reduce(
		(html, { token, text }) => html.replace(token, () => text),
		html,
	);
};
