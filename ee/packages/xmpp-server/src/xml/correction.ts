import type Element from 'ltx/lib/Element';

import { xml } from './build';
import { NS_CORRECT } from './namespaces';

/** The XEP-0308 `<replace/>` child marking a message as a correction of `replaceId`; nothing for a plain message. */
export function buildReplace(replaceId?: string): Element | undefined {
	return replaceId ? xml('replace', { xmlns: NS_CORRECT, id: replaceId }) : undefined;
}

export function parseReplaceId(message: Element): string | undefined {
	return message.getChild('replace', NS_CORRECT)?.attrs.id;
}
