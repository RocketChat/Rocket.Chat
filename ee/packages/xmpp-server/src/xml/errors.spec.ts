import { parse } from 'ltx';
import type Element from 'ltx/lib/Element';

import { stanzaErrorCondition } from './errors';

const p = (xmlString: string): Element => parse(xmlString) as unknown as Element;

const NS = 'urn:ietf:params:xml:ns:xmpp-stanzas';

describe('stanzaErrorCondition (hosted-muc R19)', () => {
	it.each([
		['declared on the condition', `<error type='wait'><recipient-unavailable xmlns='${NS}'/></error>`],
		['declared under a prefix on the error', `<error type='wait' xmlns:e='${NS}'><e:recipient-unavailable/></error>`],
		['declared under a prefix on the stanza', `<error type='wait'><e:recipient-unavailable/></error>`],
		['after a text', `<error type='wait'><text xmlns='${NS}'>gone</text><recipient-unavailable xmlns='${NS}'/></error>`],
	])('reads the condition %s', (_, error) => {
		expect(stanzaErrorCondition(p(`<message type='error' xmlns:e='${NS}'>${error}</message>`))).toBe('recipient-unavailable');
	});

	it.each([
		['no error', `<message type='error'/>`],
		['an error with only a text', `<message type='error'><error type='cancel'><text xmlns='${NS}'>gone</text></error></message>`],
		[
			'an error whose only child is in another namespace',
			`<message type='error'><error type='cancel'><gone xmlns='urn:example'/></error></message>`,
		],
	])('finds no condition in %s', (_, stanza) => {
		expect(stanzaErrorCondition(p(stanza))).toBeUndefined();
	});
});
