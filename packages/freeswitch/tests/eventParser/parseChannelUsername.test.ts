import { describe, expect, it } from '@jest/globals';

import { parseChannelUsername, parseContactUsername, parseEventUsername } from '../../src/eventParser/parseChannelUsername';
import type { EventData } from '../../src/eventParser/parseEventData';

function createEventData(data: Record<string, string | string[] | undefined>): EventData {
	return data as unknown as EventData;
}

describe('parseChannelUsername', () => {
	it('should parse username from originator channel', () => {
		const channelName = 'sofia/internal/1001@voip.open.rocket.chat:9999';
		const result = parseChannelUsername(channelName);
		expect(result).toBe('1001');
	});

	it('should parse username from external channel', () => {
		const channelName = 'sofia/external/1001@voip.open.rocket.chat:9999';
		const result = parseChannelUsername(channelName);
		expect(result).toBe('1001');
	});

	it('should parse username from originatee channel', () => {
		const channelName = 'sofia/internal/1000-LJZ8A9MhHv4Eh6ZQH-spo254ol@open.rocket.chat';
		const result = parseChannelUsername(channelName);
		expect(result).toBe('1000');
	});

	it('should return undefined for non-sofia channel', () => {
		const channelName = 'voicemail/default/1001';
		const result = parseChannelUsername(channelName);
		expect(result).toBeUndefined();
	});

	it('should return undefined for invalid channel format', () => {
		const channelName = 'sofia/internal/invalid';
		const result = parseChannelUsername(channelName);
		expect(result).toBeUndefined();
	});

	it('should return undefined if username is not number only', () => {
		const channelName = 'sofia/internal/10AB@voip-open.rocket.chat:9999';
		const result = parseChannelUsername(channelName);
		expect(result).toBeUndefined();
	});

	it('should return undefined for undefined input', () => {
		const result = parseChannelUsername(undefined);
		expect(result).toBeUndefined();
	});
});

describe('parseContactUsername', () => {
	it('should parse username from contact URI', () => {
		const contactUri = '1001-abc123-xyz789@rocket.chat';
		const result = parseContactUsername(contactUri);
		expect(result).toBe('1001');
	});

	it('should return undefined for invalid contact URI', () => {
		const contactUri = 'invalid-contact-uri';
		const result = parseContactUsername(contactUri);
		expect(result).toBeUndefined();
	});

	it('should return undefined for non-numeric username', () => {
		const contactUri = 'user123-abc123-xyz789@rocket.chat';
		const result = parseContactUsername(contactUri);
		expect(result).toBeUndefined();
	});
});

describe('parseEventUsername', () => {
	it('should parse username from event data', () => {
		const eventData = createEventData({
			'Channel-Name': 'sofia/internal/1001@voip.open.rocket.chat:9999',
		});

		const result = parseEventUsername(eventData);
		expect(result).toBe('1001');
	});

	it('should return undefined when channel name is missing', () => {
		const eventData = createEventData({});

		const result = parseEventUsername(eventData);
		expect(result).toBeUndefined();
	});

	it('should return undefined for non-sofia channel', () => {
		const eventData = createEventData({
			'Channel-Name': 'voicemail/default/1001',
		});

		const result = parseEventUsername(eventData);
		expect(result).toBeUndefined();
	});
});
