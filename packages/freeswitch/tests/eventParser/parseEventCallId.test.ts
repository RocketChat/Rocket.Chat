import { describe, expect, it } from '@jest/globals';

import { parseEventCallId } from '../../src/eventParser/parseEventCallId';
import type { EventData } from '../../src/eventParser/parseEventData';

describe('parseEventCallId', () => {
	const createTestEvent = (overrides: Partial<EventData>): EventData => ({
		...overrides,
	});

	it('should use Channel-Call-UUID when IDs match and type is not originator', () => {
		const event = createTestEvent({
			'Channel-Call-UUID': 'call-123',
			'Unique-ID': 'call-123',
			'Other-Type': 'not-originator',
		});

		const result = parseEventCallId(event);

		expect(result).toBe('call-123');
	});

	it('should use Channel-Call-UUID when IDs differ', () => {
		const event = createTestEvent({
			'Channel-Call-UUID': 'call-123',
			'Unique-ID': 'channel-456',
			'Other-Type': 'originator',
			'Other-Leg-Unique-ID': 'other-789',
		});

		const result = parseEventCallId(event);

		expect(result).toBe('call-123');
	});

	it('should use Other-Leg-Unique-ID for outbound callers with originator', () => {
		const event = createTestEvent({
			'Channel-Call-UUID': 'call-123',
			'Unique-ID': 'call-123',
			'Other-Type': 'originator',
			'Other-Leg-Unique-ID': 'other-789',
			'Caller-Direction': 'outbound',
			'Other-Leg-Direction': 'inbound',
		});

		const result = parseEventCallId(event);

		expect(result).toBe('other-789');
	});

	it('should use Channel-Call-UUID when Other-Leg-Unique-ID is missing', () => {
		const event = createTestEvent({
			'Channel-Call-UUID': 'call-123',
			'Unique-ID': 'call-123',
			'Other-Type': 'originator',
			'Caller-Direction': 'outbound',
			'Other-Leg-Direction': 'inbound',
		});

		const result = parseEventCallId(event);

		expect(result).toBe('call-123');
	});

	it('should use Channel-Call-UUID for inbound callers', () => {
		const event = createTestEvent({
			'Channel-Call-UUID': 'call-123',
			'Unique-ID': 'call-123',
			'Other-Type': 'originator',
			'Other-Leg-Unique-ID': 'other-789',
			'Caller-Direction': 'inbound',
			'Other-Leg-Direction': 'outbound',
		});

		const result = parseEventCallId(event);

		expect(result).toBe('call-123');
	});

	it('should use Channel-Call-UUID when Other-Leg-Direction is outbound with logical direction', () => {
		const event = createTestEvent({
			'Channel-Call-UUID': 'call-123',
			'Unique-ID': 'call-123',
			'Other-Type': 'originator',
			'Other-Leg-Unique-ID': 'other-789',
			'Caller-Direction': 'outbound',
			'Other-Leg-Direction': 'outbound',
			'Other-Leg-Logical-Direction': 'inbound',
		});

		const result = parseEventCallId(event);

		expect(result).toBe('call-123');
	});

	it('should return undefined when no call ID is present', () => {
		const event = createTestEvent({});

		const result = parseEventCallId(event);

		expect(result).toBeUndefined();
	});
});
