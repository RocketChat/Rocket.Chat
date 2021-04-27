import { callbacks } from '../../app/callbacks/lib/callbacks';
import { IMessage } from '../../definition/IMessage';
import { escapeHTML } from '../../lib/escapeHTML';

export const renderMessageBody = <T extends Partial<IMessage> & { html?: string }>(
	message: T,
): string => {
	const msgWithRemovedAngleBrackets = message.msg // remove the <> in urls
		?.replace(
			/<(?<actualURL>([A-Za-z]{3,9}):\/\/([-;:&=\+\$,\w]+@{1})?([-A-Za-z0-9\.]+)+:?(\d+)?((\/[-\+=!:~%\/\.@\,\(\)\w]*)?\??([-\+=&!:;%@\/\.\,\w]+)?(?:#([^\s\)]+))?)?)>/g,
			'$<actualURL>',
		);

	message.html = msgWithRemovedAngleBrackets?.trim()
		? escapeHTML(msgWithRemovedAngleBrackets.trim())
		: '';

	const { tokens, html } = callbacks.run('renderMessage', message);

	return (Array.isArray(tokens) ? tokens.reverse() : []).reduce(
		(html, { token, text }) => html.replace(token, () => text),
		html,
	);
};
