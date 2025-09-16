import { extractChannelChangesFromEvent } from '../../src/eventParser/extractChannelChangesFromEvent';

describe('extractChannelChangesFromEvent', () => {
	it('should detect new values', () => {
		const channelState = {};
		const eventValues = {
			simple: 'value',
			number: 42,
			date: new Date('2024-01-01'),
		};

		const result = extractChannelChangesFromEvent(channelState, 'test-event', eventValues);

		expect(result.newValues).toEqual({
			simple: 'value',
			number: 42,
			date: new Date('2024-01-01'),
		});
		expect(result.changedValues).toEqual({
			simple: 'value',
			number: 42,
			date: new Date('2024-01-01'),
		});
		expect(result.changedExistingValues).toEqual({});
	});

	it('should detect changed values', () => {
		const channelState = {
			simple: 'old',
			number: 42,
			date: new Date('2024-01-01'),
		};
		const eventValues = {
			simple: 'new',
			number: 43,
			date: new Date('2024-01-02'),
		};

		const result = extractChannelChangesFromEvent(channelState, 'test-event', eventValues);

		expect(result.newValues).toEqual({});
		expect(result.changedValues).toEqual({
			simple: 'new',
			number: 43,
			date: new Date('2024-01-02'),
		});
		expect(result.changedExistingValues).toEqual({
			simple: {
				oldValue: 'old',
				newValue: 'new',
			},
			number: {
				oldValue: 42,
				newValue: 43,
			},
			date: {
				oldValue: new Date('2024-01-01'),
				newValue: new Date('2024-01-02'),
				delta: 24 * 60 * 60 * 1000, // 1 day in milliseconds
			},
		});
	});

	it('should handle arrays', () => {
		const channelState = {
			simple: ['a', 'b'],
			variables: ['x', 'y'],
		};
		const eventValues = {
			simple: ['b', 'c'],
			variables: ['y', 'z'],
		};

		const result = extractChannelChangesFromEvent(channelState, 'test-event', eventValues);

		expect(result.newValues).toEqual({});
		expect(result.changedValues).toEqual({
			simple: ['b', 'c'],
			variables: ['y', 'z'],
		});
		expect(result.changedExistingValues).toEqual({
			simple: {
				oldValue: ['a', 'b'],
				newValue: ['b', 'c'],
			},
			variables: {
				newValue: ['y', 'z'],
				oldValue: ['x', 'y'],
			},
		});
	});

	it('should handle bridgeUniqueIds specially', () => {
		const channelState = {
			bridgeUniqueIds: ['bridge1', 'bridge2'],
		};
		const eventValues = {
			bridgeUniqueIds: ['bridge2', 'bridge3'],
		};

		const result = extractChannelChangesFromEvent(channelState, 'test-event', eventValues);

		expect(result.newValues).toEqual({});
		expect(result.changedValues).toEqual({
			bridgeUniqueIds: ['bridge1', 'bridge2', 'bridge3'],
		});
		expect(result.changedExistingValues).toEqual({
			bridgeUniqueIds: {
				oldValue: ['bridge1', 'bridge2'],
				newValue: ['bridge1', 'bridge2', 'bridge3'],
			},
		});
	});

	it('should handle single bridgeUniqueId values', () => {
		const channelState = {
			bridgeUniqueIds: 'bridge1',
		};
		const eventValues = {
			bridgeUniqueIds: 'bridge2',
		};

		const result = extractChannelChangesFromEvent(channelState, 'test-event', eventValues);

		expect(result.newValues).toEqual({});
		expect(result.changedValues).toEqual({
			bridgeUniqueIds: ['bridge1', 'bridge2'],
		});
		expect(result.changedExistingValues).toEqual({
			bridgeUniqueIds: {
				oldValue: 'bridge1',
				newValue: ['bridge1', 'bridge2'],
			},
		});
	});

	it('should ignore unchanged values', () => {
		const channelState = {
			'simple': 'value',
			'number': 42,
			'date': new Date('2024-01-01'),
			'variables.array': ['a', 'b'],
		};
		const eventValues = {
			'simple': 'value',
			'number': 42,
			'date': new Date('2024-01-01'),
			'variables.array': ['a', 'b'],
		};

		const result = extractChannelChangesFromEvent(channelState, 'test-event', eventValues);

		expect(result.newValues).toEqual({});
		expect(result.changedValues).toEqual({});
		expect(result.changedExistingValues).toEqual({});
	});

	it('should ignore missing values in the bridgeUniqueIds param', () => {
		const channelState = {
			simple: 'value',
			bridgeUniqueIds: ['1', '2', '3'],
		};
		const eventValues = {
			simple: 'value',
			bridgeUniqueIds: ['1', '3'],
		};

		const result = extractChannelChangesFromEvent(channelState, 'test-event', eventValues);

		expect(result.newValues).toEqual({});
		expect(result.changedValues).toEqual({});
		expect(result.changedExistingValues).toEqual({});
	});

	it('should handle mixed arrays and values', () => {
		const channelState = {
			'variables.array': ['1', '3'],
		};
		const eventValues = {
			'variables.array': '1',
		};

		const result = extractChannelChangesFromEvent(channelState, 'test-event', eventValues);

		expect(result.newValues).toEqual({});
		expect(result.changedValues).toEqual({
			'variables.array': '1',
		});
		expect(result.changedExistingValues).toEqual({
			'variables.array': {
				newValue: '1',
				oldValue: ['1', '3'],
			},
		});
	});

	it('should handle undefined values', () => {
		const channelState = {
			simple: 'value',
			number: 42,
		};
		const eventValues = {
			simple: undefined,
			number: 42,
		};

		const result = extractChannelChangesFromEvent(channelState, 'test-event', eventValues);

		expect(result.newValues).toEqual({});
		expect(result.changedValues).toEqual({});
		expect(result.changedExistingValues).toEqual({});
	});

	it('should handle variables arrays specially', () => {
		const channelState = {
			'variables.array': ['a', 'b'],
		};
		const eventValues = {
			'variables.array': ['b', 'a'],
		};

		const result = extractChannelChangesFromEvent(channelState, 'test-event', eventValues);

		expect(result.newValues).toEqual({});
		expect(result.changedValues).toEqual({});
		expect(result.changedExistingValues).toEqual({});
	});
});
