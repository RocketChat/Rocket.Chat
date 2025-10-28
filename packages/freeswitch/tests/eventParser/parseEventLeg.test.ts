import { describe, expect, it } from '@jest/globals';

import type { EventData } from '../../src/eventParser/parseEventData';
import { parseEventLeg } from '../../src/eventParser/parseEventLeg';

describe('parseEventLeg', () => {
	const createTestEvent = (overrides: EventData): EventData => ({
		...overrides,
	});

	it('should parse caller leg data', () => {
		const event = createTestEvent({
			'Caller-Leg-Direction': 'outbound',
			'Caller-Leg-Logical-Direction': 'outbound',
			'Caller-Leg-Username': '1001',
			'Caller-Leg-Caller-ID-Name': 'John Doe',
			'Caller-Leg-Caller-ID-Number': '1001',
			'Caller-Leg-Network-Addr': '192.168.1.100',
			'Caller-Leg-Destination-Number': '1002',
			'Caller-Leg-Unique-ID': 'channel-123',
			'Caller-Leg-Source': 'mod_sofia',
			'Caller-Leg-Context': 'default',
			'Caller-Leg-Channel-Name': 'sofia/internal/1001@192.168.1.100',
			'Caller-Leg-Profile-Index': '1',
			'Caller-Leg-Profile-Created-Time': '1709123456789000',
			'Caller-Leg-Channel-Created-Time': '1709123457123000',
			'Caller-Leg-Channel-Answered-Time': '1709123458456000',
			'Caller-Leg-Channel-Hangup-Time': '1709123459789000',
		});

		const result = parseEventLeg('Caller-Leg', event);

		expect(result).toBeDefined();
		expect(result?.legName).toBe('Caller-Leg');
		expect(result?.uniqueId).toBe('channel-123');
		expect(result?.direction).toBe('outbound');
		expect(result?.logicalDirection).toBe('outbound');
		expect(result?.username).toBe('1001');
		expect(result?.callerName).toBe('John Doe');
		expect(result?.callerNumber).toBe('1001');
		expect(result?.networkAddress).toBe('192.168.1.100');
		expect(result?.destinationNumber).toBe('1002');
		expect(result?.source).toBe('mod_sofia');
		expect(result?.context).toBe('default');
		expect(result?.channelName).toBe('sofia/internal/1001@192.168.1.100');
		expect(result?.profiles).toBeDefined();
		expect(result?.profiles?.['1']).toBeDefined();
		expect(result?.profiles?.['1'].profileIndex).toBe('1');
		expect(result?.profiles?.['1'].profileCreatedTime?.getTime()).toBe(1709123456789);
		expect(result?.profiles?.['1'].channelCreatedTime?.getTime()).toBe(1709123457123);
		expect(result?.profiles?.['1'].channelAnsweredTime?.getTime()).toBe(1709123458456);
		expect(result?.profiles?.['1'].channelHangupTime?.getTime()).toBe(1709123459789);
		expect(result?.raw).toBeUndefined();
	});

	it('should parse other leg data with type', () => {
		const event = createTestEvent({
			'Other-Leg-Direction': 'inbound',
			'Other-Leg-Logical-Direction': 'inbound',
			'Other-Leg-Username': '1002',
			'Other-Leg-Caller-ID-Name': 'Jane Smith',
			'Other-Leg-Caller-ID-Number': '1002',
			'Other-Leg-Network-Addr': '192.168.1.101',
			'Other-Leg-Destination-Number': '1001',
			'Other-Leg-Unique-ID': 'channel-456',
			'Other-Leg-Source': 'mod_sofia',
			'Other-Leg-Context': 'default',
			'Other-Leg-Channel-Name': 'sofia/internal/1002@192.168.1.101',
			'Other-Type': 'originator',
		});

		const result = parseEventLeg('Other-Leg', event);

		expect(result).toBeDefined();
		expect(result?.legName).toBe('Other-Leg');
		expect(result?.uniqueId).toBe('channel-456');
		expect(result?.direction).toBe('inbound');
		expect(result?.logicalDirection).toBe('inbound');
		expect(result?.username).toBe('1002');
		expect(result?.callerName).toBe('Jane Smith');
		expect(result?.callerNumber).toBe('1002');
		expect(result?.networkAddress).toBe('192.168.1.101');
		expect(result?.destinationNumber).toBe('1001');
		expect(result?.source).toBe('mod_sofia');
		expect(result?.context).toBe('default');
		expect(result?.channelName).toBe('sofia/internal/1002@192.168.1.101');
		expect(result?.type).toBe('originator');
		expect(result?.raw).toBeUndefined();
	});

	it('should return undefined when unique ID is missing', () => {
		const event = createTestEvent({
			'Caller-Leg-Direction': 'outbound',
			'Caller-Leg-Logical-Direction': 'outbound',
			'Caller-Leg-Username': '1001',
			'Caller-Leg-Caller-ID-Name': 'John Doe',
			'Caller-Leg-Caller-ID-Number': '1001',
			'Caller-Leg-Network-Addr': '192.168.1.100',
			'Caller-Leg-Destination-Number': '1002',
			'Caller-Leg-Source': 'mod_sofia',
			'Caller-Leg-Context': 'default',
			'Caller-Leg-Channel-Name': 'sofia/internal/1001@192.168.1.100',
		});

		const result = parseEventLeg('Caller-Leg', event);

		expect(result).toBeUndefined();
	});

	it('should handle missing optional fields', () => {
		const event = createTestEvent({
			'Caller-Leg-Direction': 'outbound',
			'Caller-Leg-Logical-Direction': 'outbound',
			'Caller-Leg-Username': '1001',
			'Caller-Leg-Unique-ID': 'channel-123',
		});

		const result = parseEventLeg('Caller-Leg', event);

		expect(result).toBeDefined();
		expect(result?.legName).toBe('Caller-Leg');
		expect(result?.uniqueId).toBe('channel-123');
		expect(result?.direction).toBe('outbound');
		expect(result?.logicalDirection).toBe('outbound');
		expect(result?.username).toBe('1001');
		expect(result?.callerName).toBeUndefined();
		expect(result?.callerNumber).toBeUndefined();
		expect(result?.networkAddress).toBeUndefined();
		expect(result?.destinationNumber).toBeUndefined();
		expect(result?.source).toBeUndefined();
		expect(result?.context).toBeUndefined();
		expect(result?.channelName).toBeUndefined();
		expect(result?.profiles).toBeUndefined();
		expect(result?.raw).toBeUndefined();
	});

	it('should filter out empty values from raw data', () => {
		const event = createTestEvent({
			'Caller-Direction': 'outbound',
			'Caller-Logical-Direction': 'outbound',
			'Caller-Username': '1001',
			'Caller-Unique-ID': 'channel-123',
			'Caller-Empty-Value': '',
			'Caller-Undefined-Value': undefined,
			'Caller-Unused-Variable': 'unused-value',
		});

		const result = parseEventLeg('Caller', event);

		expect(result).toBeDefined();
		expect(result?.raw).toBeDefined();
		expect(result?.raw['Empty-Value']).toBeUndefined();
		expect(result?.raw['Undefined-Value']).toBeUndefined();
	});
});
