import { describe, expect, it } from '@jest/globals';

import { filterStringList } from '../../src/eventParser/filterStringList';
import type { EventData } from '../../src/eventParser/parseEventData';

function createEventData(data: Record<string, string | string[] | undefined>): EventData {
	return data as unknown as EventData;
}

describe('filterStringList', () => {
	it('should filter entries based on key filter function', () => {
		const eventData = createEventData({
			'Channel-Name': 'test-channel',
			'Channel-State': 'CS_INIT',
			'variable_test': 'test-value',
			'variable_array': ['value1', 'value2'],
		});

		const result = filterStringList(eventData, (key) => key.startsWith('variable_'));

		expect(result).toEqual({
			variable_test: 'test-value',
			variable_array: ['value1', 'value2'],
		});
	});

	it('should return empty object when no entries match filter', () => {
		const eventData = createEventData({
			'Channel-Name': 'test-channel',
			'Channel-State': 'CS_INIT',
		});

		const result = filterStringList(eventData, (key) => key.startsWith('variable_'));

		expect(result).toEqual({});
	});

	it('should apply map function to filtered entries', () => {
		const eventData = createEventData({
			variable_test1: 'value1',
			variable_test2: 'value2',
			variable_test3: 'value3',
		});

		const result = filterStringList(
			eventData,
			(key) => key.startsWith('variable_'),
			([key, value]) => [key.replace('variable_', ''), value],
		);

		expect(result).toEqual({
			test1: 'value1',
			test2: 'value2',
			test3: 'value3',
		});
	});

	it('should filter out undefined mapped entries', () => {
		const eventData = createEventData({
			variable_test1: 'value1',
			variable_test2: 'value2',
			variable_test3: 'value3',
		});

		const result = filterStringList(
			eventData,
			(key) => key.startsWith('variable_'),
			([key, value]) => (key === 'variable_test2' ? undefined : [key.replace('variable_', ''), value]),
		);

		expect(result).toEqual({
			test1: 'value1',
			test3: 'value3',
		});
	});

	it('should handle array values', () => {
		const eventData = createEventData({
			variable_array1: ['value1', 'value2'],
			variable_array2: ['value3', 'value4'],
		});

		const result = filterStringList(
			eventData,
			(key) => key.startsWith('variable_'),
			([key, value]) => [key.replace('variable_', ''), value],
		);

		expect(result).toEqual({
			array1: ['value1', 'value2'],
			array2: ['value3', 'value4'],
		});
	});

	it('should handle undefined values', () => {
		const eventData = createEventData({
			variable_test1: undefined,
			variable_test2: 'value2',
		});

		const result = filterStringList(
			eventData,
			(key) => key.startsWith('variable_'),
			([key, value]) => [key.replace('variable_', ''), value],
		);

		expect(result).toEqual({
			test1: undefined,
			test2: 'value2',
		});
	});
});
