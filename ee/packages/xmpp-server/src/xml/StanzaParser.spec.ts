import type Element from 'ltx/lib/Element';

import { StanzaParser } from './StanzaParser';

const STREAM_HEADER =
	"<stream:stream xmlns='jabber:server' xmlns:stream='http://etherx.jabber.org/streams' from='a.tld' to='b.tld' version='1.0'>";

describe('StanzaParser', () => {
	const collect = (parser: StanzaParser) => {
		const events: { type: string; payload?: unknown }[] = [];
		parser.on('streamStart', (el) => events.push({ type: 'streamStart', payload: el }));
		parser.on('stanza', (el) => events.push({ type: 'stanza', payload: el }));
		parser.on('streamEnd', () => events.push({ type: 'streamEnd' }));
		parser.on('error', (error) => events.push({ type: 'error', payload: error }));
		return events;
	};

	it('emits the stream header and complete depth-1 stanzas', () => {
		const parser = new StanzaParser();
		const events = collect(parser);

		parser.write(`<?xml version='1.0'?>${STREAM_HEADER}`);
		parser.write("<message from='u@a.tld' to='v@b.tld'><body>hi</body></message>");

		expect(events).toHaveLength(2);
		expect(events[0].type).toBe('streamStart');
		expect((events[0].payload as Element).attrs.from).toBe('a.tld');
		expect(events[1].type).toBe('stanza');
		const stanza = events[1].payload as Element;
		expect(stanza.name).toBe('message');
		expect(stanza.getChildText('body')).toBe('hi');
	});

	it('handles stanzas split across chunks', () => {
		const parser = new StanzaParser();
		const events = collect(parser);

		parser.write(STREAM_HEADER);
		parser.write('<message><bo');
		parser.write('dy>split</body></mes');
		parser.write('sage>');

		expect(events.filter((e) => e.type === 'stanza')).toHaveLength(1);
		expect((events[1].payload as Element).getChildText('body')).toBe('split');
	});

	it('emits streamEnd on the closing tag', () => {
		const parser = new StanzaParser();
		const events = collect(parser);

		parser.write(`${STREAM_HEADER}</stream:stream>`);

		expect(events.map((e) => e.type)).toEqual(['streamStart', 'streamEnd']);
	});

	it('rejects DOCTYPE declarations', () => {
		const parser = new StanzaParser();
		const events = collect(parser);

		parser.write("<?xml version='1.0'?><!DOCTYPE foo [<!ENTITY bar 'x'>]>");

		expect(events[0].type).toBe('error');
	});

	it('rejects comments even when split across chunks', () => {
		const parser = new StanzaParser();
		const events = collect(parser);

		parser.write(`${STREAM_HEADER}<`);
		parser.write('!-- sneaky -->');

		expect(events.some((e) => e.type === 'error')).toBe(true);
	});

	it('rejects processing instructions after the prologue', () => {
		const parser = new StanzaParser();
		const events = collect(parser);

		parser.write(`${STREAM_HEADER}<?php evil ?>`);

		expect(events.some((e) => e.type === 'error')).toBe(true);
	});

	it('rejects oversized stanzas', () => {
		const parser = new StanzaParser({ maxStanzaSize: 128 });
		const events = collect(parser);

		parser.write(STREAM_HEADER);
		parser.write(`<message><body>${'x'.repeat(256)}</body></message>`);

		expect(events.some((e) => e.type === 'error')).toBe(true);
	});

	it('rejects excessive nesting depth', () => {
		const parser = new StanzaParser();
		const events = collect(parser);

		parser.write(STREAM_HEADER);
		parser.write(`${'<a>'.repeat(40)}`);

		expect(events.some((e) => e.type === 'error')).toBe(true);
	});

	it('is reusable after reset (stream restart)', () => {
		const parser = new StanzaParser();
		const events = collect(parser);

		parser.write(`<?xml version='1.0'?>${STREAM_HEADER}`);
		parser.reset();
		parser.write(`<?xml version='1.0'?>${STREAM_HEADER}<message><body>after restart</body></message>`);

		const stanzas = events.filter((e) => e.type === 'stanza');
		expect(events.filter((e) => e.type === 'streamStart')).toHaveLength(2);
		expect(stanzas).toHaveLength(1);
		expect((stanzas[0].payload as Element).getChildText('body')).toBe('after restart');
	});

	it('stops emitting after a fatal error', () => {
		const parser = new StanzaParser();
		const events = collect(parser);

		parser.write('<!DOCTYPE x>');
		parser.write(`${STREAM_HEADER}<message/>`);

		expect(events.filter((e) => e.type !== 'error')).toHaveLength(0);
	});
});
