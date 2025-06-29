import { describe, expect, it } from '@jest/globals';

import { parseChannelKind } from '../../src/eventParser/parseChannelKind';

describe('parseChannelKind', () => {
	it('should parse kind from originator channel', () => {
		const channelName = 'sofia/internal/1001@voip.open.rocket.chat:9999';
		const result = parseChannelKind(channelName);
		expect(result).toBe('internal');
	});

	it('should parse kind from external channel', () => {
		const channelName = 'sofia/external/1001@voip.open.rocket.chat:9999';
		const result = parseChannelKind(channelName);
		expect(result).toBe('external');
	});

	it('should parse kind from voicemail channel', () => {
		const channelName = 'loopback/voicemail-a';
		const result = parseChannelKind(channelName);
		expect(result).toBe('voicemail');
	});

	it('should parse kind from originatee channel', () => {
		const channelName = 'sofia/internal/1000-LJZ8A9MhHv4Eh6ZQH-spo254ol@open.rocket.chat';
		const result = parseChannelKind(channelName);
		expect(result).toBe('internal');
	});

	it('should return unknown for non-sofia channel', () => {
		const channelName = 'voicemail/default/1001';
		const result = parseChannelKind(channelName);
		expect(result).toBe('unknown');
	});

	it('should return unknown for invalid channel format', () => {
		const channelName = 'sofia/invalid';
		const result = parseChannelKind(channelName);
		expect(result).toBe('unknown');
	});

	it('should return unknown for undefined input', () => {
		const result = parseChannelKind(undefined);
		expect(result).toBe('unknown');
	});

	it('should return unknown for empty input', () => {
		const result = parseChannelKind('');
		expect(result).toBe('unknown');
	});
});
