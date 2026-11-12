import type Element from 'ltx/lib/Element.js';

import { xml } from '../xml/build.js';
import { NS_PING } from '../xml/namespaces.js';

export function isPing(iq: Element): boolean {
	return iq.attrs.type === 'get' && iq.getChild('ping', NS_PING) !== undefined;
}

/** XEP-0199: an empty result acknowledges the ping. */
export function buildPingReply(iq: Element): Element {
	return xml('iq', { from: iq.attrs.to, to: iq.attrs.from, id: iq.attrs.id, type: 'result' });
}
