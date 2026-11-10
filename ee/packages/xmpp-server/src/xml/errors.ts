import type Element from 'ltx/lib/Element';

import { xml } from './build';
import { NS_STANZA_ERRORS } from './namespaces';

export type StanzaErrorType = 'auth' | 'cancel' | 'continue' | 'modify' | 'wait';

/** The RFC 6120 §8.3 error reply to `original`. */
export function buildStanzaError(original: Element, condition: string, type: StanzaErrorType, text?: string): Element {
	const reply = xml(original.name, {
		'from': original.attrs.to,
		'to': original.attrs.from,
		'type': 'error',
		'id': original.attrs.id,
		'xml:lang': original.attrs['xml:lang'],
	});

	const error = xml('error', { type }, xml(condition, { xmlns: NS_STANZA_ERRORS }));
	if (text) {
		error.cnode(xml('text', { xmlns: NS_STANZA_ERRORS }, text));
	}
	reply.cnode(error);

	return reply;
}
