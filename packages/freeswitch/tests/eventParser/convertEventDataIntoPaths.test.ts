import { convertEventDataIntoPaths } from '../../src/eventParser/convertEventDataIntoPaths';

describe('convertEventDataIntoPaths', () => {
	const baseEventData = {
		callUniqueId: 'test-call-123',
		channelName: 'test-channel',
		channelState: 'CS_EXECUTE',
		channelCallState: 'CS_EXECUTE',
		raw: {},
	};

	it('should handle simple object', () => {
		const channelUniqueId = 'test-channel-123';
		const eventData: any = {
			simple: '15',
		};

		const result = convertEventDataIntoPaths(channelUniqueId, eventData, {});

		expect(result).toMatchObject({
			simple: '15',
		});
	});

	it('should handle simple object with legs', () => {
		const channelUniqueId = 'test-channel-123';
		const eventData: any = {
			simple: '15',
			legs: {
				one: {
					simple: '20',
				},
			},
		};

		const result = convertEventDataIntoPaths(channelUniqueId, eventData, {});

		expect(result).toMatchObject({
			'simple': '15',
			'legs.one.simple': '20',
		});
	});

	it('should handle simple object with legs and profiles', () => {
		const channelUniqueId = 'test-channel-123';
		const eventData: any = {
			simple: '15',
			legs: {
				one: {
					profiles: {
						simple: '30',
					},
					simple: '20',
				},
				[channelUniqueId]: {
					profiles: '40',
				},
			},
		};

		const result = convertEventDataIntoPaths(channelUniqueId, eventData, {});

		expect(result).toMatchObject({
			'simple': '15',
			'legs.one.simple': '20',
			'legs.one.profiles.simple': '30',
			[`legs.${channelUniqueId}.profiles`]: '40',
		});
	});

	it('should not break when handling invalid data', () => {
		const channelUniqueId = 'test-channel-123';
		const eventData: any = {
			legs: {
				[channelUniqueId]: {
					profiles: new Date(),
				},
			},
		};

		const result = convertEventDataIntoPaths(channelUniqueId, eventData, {});
		expect(result).toBeDefined();
		expect(result[`legs.${channelUniqueId}.profiles`]).toBeInstanceOf(Date);
	});

	it('should not break when handling invalid data [2]', () => {
		const channelUniqueId = 'test-channel-123';
		const eventData: any = {
			legs: {
				[channelUniqueId]: {
					profiles: {
						first: false,
						last: 0,
					},
				},
			},
		};

		const result = convertEventDataIntoPaths(channelUniqueId, eventData, { callee: '20' });
		expect(result).toEqual({
			[`legs.${channelUniqueId}.profiles.first`]: false,
			[`legs.${channelUniqueId}.profiles.last`]: 0,
		});
	});

	it('should convert event data into paths with basic structure', () => {
		const channelUniqueId = 'test-channel-123';
		const eventData: any = {
			...baseEventData,
			legs: {
				[channelUniqueId]: {
					raw: {},
					legName: `leg-${channelUniqueId}`,
					uniqueId: channelUniqueId,
					profiles: {
						'profile-1': {
							bridgedTo: 'original-bridge',
							callee: 'original-callee',
						},
					},
				},
			},
		};

		const dataToInsertIntoProfile = {
			bridgedTo: 'new-bridge',
			callee: 'new-callee',
		};

		const result = convertEventDataIntoPaths(channelUniqueId, eventData, dataToInsertIntoProfile);

		expect(result).toEqual({
			'callUniqueId': 'test-call-123',
			'channelName': 'test-channel',
			'channelState': 'CS_EXECUTE',
			'channelCallState': 'CS_EXECUTE',
			'raw': {},
			'legs.test-channel-123.raw': {},
			'legs.test-channel-123.legName': 'leg-test-channel-123',
			'legs.test-channel-123.uniqueId': 'test-channel-123',
			'legs.test-channel-123.profiles.profile-1.bridgedTo': 'new-bridge',
			'legs.test-channel-123.profiles.profile-1.callee': 'new-callee',
		});
	});

	it('should handle event data without legs', () => {
		const channelUniqueId = 'test-channel-123';
		const eventData: any = {
			...baseEventData,
		};
		const dataToInsertIntoProfile = {
			bridgedTo: 'new-bridge',
		};

		const result = convertEventDataIntoPaths(channelUniqueId, eventData, dataToInsertIntoProfile);

		expect(result).toEqual({
			callUniqueId: 'test-call-123',
			channelName: 'test-channel',
			channelState: 'CS_EXECUTE',
			channelCallState: 'CS_EXECUTE',
			raw: {},
			legs: {},
		});
	});

	it('should handle event data with legs but no profiles', () => {
		const channelUniqueId = 'test-channel-123';
		const eventData: any = {
			...baseEventData,
			legs: {
				[channelUniqueId]: {
					raw: {},
					legName: `leg-${channelUniqueId}`,
					uniqueId: channelUniqueId,
				},
			},
		};
		const dataToInsertIntoProfile = {
			bridgedTo: 'new-bridge',
		};

		const result = convertEventDataIntoPaths(channelUniqueId, eventData, dataToInsertIntoProfile);

		expect(result).toEqual({
			'callUniqueId': 'test-call-123',
			'channelName': 'test-channel',
			'channelState': 'CS_EXECUTE',
			'channelCallState': 'CS_EXECUTE',
			'raw': {},
			'legs.test-channel-123.raw': {},
			'legs.test-channel-123.legName': 'leg-test-channel-123',
			'legs.test-channel-123.uniqueId': 'test-channel-123',
		});
	});

	it('should handle event data with multiple legs but only update the specified channel', () => {
		const channelUniqueId = 'test-channel-123';
		const otherChannelId = 'other-channel-456';
		const eventData: any = {
			...baseEventData,
			legs: {
				[channelUniqueId]: {
					raw: {},
					legName: `leg-${channelUniqueId}`,
					uniqueId: channelUniqueId,
					profiles: {
						'profile-1': {
							bridgedTo: 'original-bridge-1',
						},
					},
				},
				[otherChannelId]: {
					raw: {},
					legName: `leg-${otherChannelId}`,
					uniqueId: otherChannelId,
					profiles: {
						'profile-2': {
							bridgedTo: 'original-bridge-2',
						},
					},
				},
			},
		};

		const dataToInsertIntoProfile = {
			bridgedTo: 'new-bridge',
		};

		const result = convertEventDataIntoPaths(channelUniqueId, eventData, dataToInsertIntoProfile);

		expect(result).toEqual({
			'callUniqueId': 'test-call-123',
			'channelName': 'test-channel',
			'channelState': 'CS_EXECUTE',
			'channelCallState': 'CS_EXECUTE',
			'raw': {},
			'legs.test-channel-123.raw': {},
			'legs.test-channel-123.legName': 'leg-test-channel-123',
			'legs.test-channel-123.uniqueId': 'test-channel-123',
			'legs.test-channel-123.profiles.profile-1.bridgedTo': 'new-bridge',
			'legs.other-channel-456.raw': {},
			'legs.other-channel-456.legName': 'leg-other-channel-456',
			'legs.other-channel-456.uniqueId': 'other-channel-456',
			'legs.other-channel-456.profiles.profile-2.bridgedTo': 'original-bridge-2',
		});
	});
});
