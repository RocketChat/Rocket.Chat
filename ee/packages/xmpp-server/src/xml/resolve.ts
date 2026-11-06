import type Element from 'ltx/lib/Element';

import { NS_DIALBACK, NS_SERVER, NS_STREAMS } from './namespaces';

// Conventional prefixes used when a peer relies on declarations we did not retain
const WELL_KNOWN_PREFIXES: Record<string, string> = {
	stream: NS_STREAMS,
	db: NS_DIALBACK,
};

export type ResolvedName = { localName: string; ns: string | undefined };

/**
 * Resolves a depth-1 element's namespace. Stanzas are parsed detached from the
 * stream root, so prefix declarations from the stream header must be consulted
 * explicitly; unprefixed elements default to the stream's `jabber:server`.
 */
export function resolveElement(el: Element, streamHeader?: Element): ResolvedName {
	const colonIndex = el.name.indexOf(':');

	if (colonIndex === -1) {
		return { localName: el.name, ns: el.attrs.xmlns ?? streamHeader?.attrs.xmlns ?? NS_SERVER };
	}

	const prefix = el.name.slice(0, colonIndex);
	const localName = el.name.slice(colonIndex + 1);
	const ns = el.attrs[`xmlns:${prefix}`] ?? streamHeader?.attrs[`xmlns:${prefix}`] ?? WELL_KNOWN_PREFIXES[prefix];

	return { localName, ns };
}
