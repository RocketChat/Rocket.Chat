import { insertDataIntoEventProfile } from '../../src/eventParser/insertDataIntoEventProfile';

describe('insertDataIntoEventProfile', () => {
	const baseEventData = {
		callUniqueId: 'test-call-123',
		channelName: 'test-channel',
		channelState: 'CS_EXECUTE',
		channelCallState: 'CS_EXECUTE',
		raw: {},
	};

	it('should handle simple object', () => {
		const eventData: any = {
			simple: '15',
		};

		const result = insertDataIntoEventProfile(eventData, {});

		expect(result).toEqual({
			simple: '15',
		});
	});

	it('should handle simple object with legs', () => {
		const eventData: any = {
			simple: '15',
			legs: {
				one: {
					simple: '20',
				},
			},
		};

		const result = insertDataIntoEventProfile(eventData, {});

		expect(result).toEqual({
			simple: '15',
			legs: {
				one: {
					simple: '20',
				},
			},
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

		const result = insertDataIntoEventProfile(eventData, {});

		expect(result).toEqual({
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
		});
	});

	it('should not break when handling invalid data', () => {
		const channelUniqueId = 'test-channel-123';
		const date = new Date();

		const eventData: any = {
			legs: {
				[channelUniqueId]: {
					profiles: date,
				},
			},
		};

		const result = insertDataIntoEventProfile(eventData, {});
		expect(result).toEqual({
			legs: {
				[channelUniqueId]: {
					profiles: date,
				},
			},
		});
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

		const result = insertDataIntoEventProfile(eventData, { callee: '20' });
		expect(result).toEqual({
			legs: {
				[channelUniqueId]: {
					profiles: {
						first: false,
						last: 0,
					},
				},
			},
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

		const result = insertDataIntoEventProfile(eventData, dataToInsertIntoProfile);

		expect(result).toEqual({
			...baseEventData,
			legs: {
				[channelUniqueId]: {
					raw: {},
					legName: `leg-${channelUniqueId}`,
					uniqueId: channelUniqueId,
					profiles: {
						'profile-1': {
							bridgedTo: 'new-bridge',
							callee: 'new-callee',
						},
					},
				},
			},
		});
	});

	it('should handle event data without legs', () => {
		const eventData: any = {
			...baseEventData,
		};
		const dataToInsertIntoProfile = {
			bridgedTo: 'new-bridge',
		};

		const result = insertDataIntoEventProfile(eventData, dataToInsertIntoProfile);

		expect(result).toEqual({
			...baseEventData,
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

		const result = insertDataIntoEventProfile(eventData, dataToInsertIntoProfile);

		expect(result).toEqual({
			...baseEventData,
			legs: {
				[channelUniqueId]: {
					raw: {},
					legName: `leg-${channelUniqueId}`,
					uniqueId: channelUniqueId,
				},
			},
		});
	});

	it('should handle event data with multiple legs', () => {
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
							profileIndex: 'profile-1',
						},
					},
				},
				[otherChannelId]: {
					raw: {},
					legName: `leg-${otherChannelId}`,
					uniqueId: otherChannelId,
					profiles: {
						'profile-2': {
							profileIndex: 'profile-2',
						},
					},
				},
			},
		};

		const dataToInsertIntoProfile = {
			bridgedTo: 'new-bridge',
		};

		const result = insertDataIntoEventProfile(eventData, dataToInsertIntoProfile);

		expect(result).toEqual({
			...baseEventData,
			legs: {
				[channelUniqueId]: {
					raw: {},
					legName: `leg-${channelUniqueId}`,
					uniqueId: channelUniqueId,
					profiles: {
						'profile-1': {
							profileIndex: 'profile-1',
							bridgedTo: 'new-bridge',
						},
					},
				},
				[otherChannelId]: {
					raw: {},
					legName: `leg-${otherChannelId}`,
					uniqueId: otherChannelId,
					profiles: {
						'profile-2': {
							profileIndex: 'profile-2',
							bridgedTo: 'new-bridge',
						},
					},
				},
			},
		});
	});
});
