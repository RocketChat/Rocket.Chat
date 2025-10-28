import { describe, expect, it } from '@jest/globals';
import type { IFreeSwitchChannelEventLegProfile } from '@rocket.chat/core-typings';

import { computeChannelProfiles } from '../../src/eventParser/computeChannelProfiles';

describe('computeChannelProfiles', () => {
	const createTestProfile = (overrides: Partial<IFreeSwitchChannelEventLegProfile>): IFreeSwitchChannelEventLegProfile => ({
		...overrides,
	});

	it('should compute channel profiles with all timestamps', () => {
		const profiles: Record<string, IFreeSwitchChannelEventLegProfile> = {
			profile1: createTestProfile({
				profileIndex: '1',
				profileCreatedTime: new Date(1709123456789),
				channelCreatedTime: new Date(1709123456790),
				channelAnsweredTime: new Date(1709123457789),
				channelProgressTime: new Date(1709123457889),
				channelProgressMediaTime: new Date(1709123457989),
				channelBridgedTime: new Date(1709123458789),
				channelHangupTime: new Date(1709123466789),
				channelTransferTime: new Date(1709123456791),
				channelRessurectTime: new Date(1709123456792),
				channelLastHold: new Date(1709123456793),
			}),
		};

		const result = computeChannelProfiles(profiles);

		expect(result).toEqual({
			profiles: [
				{
					profileIndex: '1',
					profileCreatedTime: new Date(1709123456789),
					channelCreatedTime: new Date(1709123456790),
					channelAnsweredTime: new Date(1709123457789),
					channelProgressTime: new Date(1709123457889),
					channelProgressMediaTime: new Date(1709123457989),
					channelBridgedTime: new Date(1709123458789),
					channelHangupTime: new Date(1709123466789),
					channelTransferTime: new Date(1709123456791),
					channelRessurectTime: new Date(1709123456792),
					channelLastHold: new Date(1709123456793),
					callDuration: 8000,
					answered: true,
					media: true,
					bridged: true,
				},
			],
			anyMedia: true,
			anyAnswer: true,
			anyBridge: true,
			durationSum: 8000,
			totalDuration: 8000,
			startedAt: new Date(1709123458789),
		});
	});

	it('should handle missing timestamps', () => {
		const profiles: Record<string, IFreeSwitchChannelEventLegProfile> = {
			profile1: createTestProfile({
				profileIndex: '1',
			}),
		};

		const result = computeChannelProfiles(profiles);
		expect(result).toEqual({
			profiles: [{ profileIndex: '1', bridged: false }],
			anyMedia: false,
			anyAnswer: false,
			anyBridge: false,
			durationSum: 0,
			totalDuration: 0,
			startedAt: undefined,
		});
	});

	it('should handle multiple profiles', () => {
		const profiles: Record<string, IFreeSwitchChannelEventLegProfile> = {
			profile1: createTestProfile({
				profileIndex: '1',
				profileCreatedTime: new Date(1709123456789),
				channelCreatedTime: new Date(1709123456790),
			}),
			profile2: createTestProfile({
				profileIndex: '2',
				profileCreatedTime: new Date(1709123456791),
				channelCreatedTime: new Date(1709123456792),
			}),
		};

		const result = computeChannelProfiles(profiles);
		expect(result).toEqual({
			profiles: [
				{
					profileIndex: '1',
					profileCreatedTime: new Date(1709123456789),
					channelCreatedTime: new Date(1709123456790),
					nextProfileCreatedTime: new Date(1709123456791),
					callDuration: 0,
					answered: true,
					media: true,
					bridged: false,
				},
				{
					channelCreatedTime: new Date(1709123456792),
					profileIndex: '2',
					profileCreatedTime: new Date(1709123456791),
					callDuration: 0,
					answered: true,
					media: true,
					bridged: false,
				},
			],
			anyMedia: true,
			anyAnswer: true,
			anyBridge: false,
			durationSum: 0,
			totalDuration: 0,
			startedAt: new Date(1709123456789),
		});
	});

	it('should handle multiple full profiles', () => {
		const forcedInvalidAttributes = {
			unknownAttribute: 'value',
			unsetAttribute: false,
		} as any;

		const profiles: Record<string, IFreeSwitchChannelEventLegProfile> = {
			profile1: createTestProfile({
				profileIndex: '1',
				profileCreatedTime: new Date(1709123456789),
				channelCreatedTime: new Date(1709123456790),
				channelAnsweredTime: new Date(1709123456789),
				channelProgressTime: new Date(1709123456889),
				channelProgressMediaTime: new Date(1709123456989),
				channelBridgedTime: new Date(1709123456789),
				channelLastHold: new Date(1709123456789),
			}),
			profile2: createTestProfile({
				profileIndex: '2',
				profileCreatedTime: new Date(1709123656789),
				channelAnsweredTime: new Date(1709123657789),
				channelProgressTime: new Date(1709123657889),
				channelProgressMediaTime: new Date(1709123657989),
				channelBridgedTime: new Date(1709123658789),
				channelHangupTime: new Date(1709123666789),
				channelTransferTime: new Date(1709123656791),
				channelRessurectTime: new Date(1709123656792),
				channelLastHold: new Date(1709123456789),
				...forcedInvalidAttributes,
			}),
		};

		const result = computeChannelProfiles(profiles);
		expect(result).toEqual({
			profiles: [
				{
					profileIndex: '1',
					profileCreatedTime: new Date(1709123456789),
					channelCreatedTime: new Date(1709123456790),
					channelAnsweredTime: new Date(1709123456789),
					channelProgressTime: new Date(1709123456889),
					channelProgressMediaTime: new Date(1709123456989),
					channelBridgedTime: new Date(1709123456789),
					channelLastHold: new Date(1709123456789),
					callDuration: 200000,
					answered: true,
					media: true,
					bridged: true,
					nextProfileCreatedTime: new Date(1709123656789),
				},
				{
					profileIndex: '2',
					profileCreatedTime: new Date(1709123656789),
					channelAnsweredTime: new Date(1709123657789),
					channelProgressTime: new Date(1709123657889),
					channelProgressMediaTime: new Date(1709123657989),
					channelBridgedTime: new Date(1709123658789),
					channelHangupTime: new Date(1709123666789),
					channelTransferTime: new Date(1709123656791),
					channelRessurectTime: new Date(1709123656792),
					// should not be carried over due to being lower than the profile create time
					channelLastHold: undefined,
					callDuration: 8000,
					answered: true,
					media: true,
					bridged: true,
				},
			],
			anyMedia: true,
			anyAnswer: true,
			anyBridge: true,
			durationSum: 208000,
			totalDuration: 210000,
			startedAt: new Date(1709123456789),
		});
	});

	it('should handle empty profiles object', () => {
		const profiles: Record<string, IFreeSwitchChannelEventLegProfile> = {};

		const result = computeChannelProfiles(profiles);
		expect(result).toEqual({ profiles: [], anyMedia: false, anyAnswer: false, anyBridge: false, durationSum: 0, totalDuration: 0 });
	});

	it('should handle profiles with no creation time', () => {
		const profiles: Record<string, IFreeSwitchChannelEventLegProfile> = {
			profile2: createTestProfile({
				profileIndex: '2',
				channelAnsweredTime: new Date(1709123457789),
			}),
		};

		const result = computeChannelProfiles(profiles);
		expect(result).toEqual({
			profiles: [{ profileIndex: '2', bridged: false }],
			anyMedia: false,
			anyAnswer: false,
			anyBridge: false,
			durationSum: 0,
			totalDuration: 0,
		});
	});

	it('validate fallback for unlikely data', () => {
		const profiles: Record<string, IFreeSwitchChannelEventLegProfile> = {
			profile1: createTestProfile({
				profileIndex: '2',
				profileCreatedTime: new Date(1709123656789),
				channelAnsweredTime: new Date(1709123657789),
				channelProgressTime: new Date(1709123657889),
				channelProgressMediaTime: new Date(1709123657989),
				channelBridgedTime: new Date(1709123658789),
				channelHangupTime: new Date(1709123666789),
			}),
			profile3: createTestProfile({
				profileIndex: '1',
				channelCreatedTime: new Date(1709123456790),
				channelAnsweredTime: new Date(1709123456789),
			}),
			profile2: createTestProfile({
				profileIndex: '1',
				channelCreatedTime: new Date(1709123456790),
				channelAnsweredTime: new Date(1709123456789),
			}),
		};

		const result = computeChannelProfiles(profiles);

		expect(result).toEqual({
			profiles: [
				{
					profileIndex: '1',
					channelCreatedTime: new Date(1709123456790),
					channelAnsweredTime: new Date(1709123456789),
					callDuration: 0,
					answered: true,
					media: true,
					bridged: false,
				},
				{
					profileIndex: '1',
					channelCreatedTime: new Date(1709123456790),
					channelAnsweredTime: new Date(1709123456789),
					nextProfileCreatedTime: new Date(1709123656789),
					callDuration: 0,
					answered: true,
					media: true,
					bridged: false,
				},
				{
					profileIndex: '2',
					profileCreatedTime: new Date(1709123656789),
					channelAnsweredTime: new Date(1709123657789),
					channelProgressTime: new Date(1709123657889),
					channelProgressMediaTime: new Date(1709123657989),
					channelBridgedTime: new Date(1709123658789),
					channelHangupTime: new Date(1709123666789),
					callDuration: 8000,
					answered: true,
					media: true,
					bridged: true,
				},
			],
			anyMedia: true,
			anyAnswer: true,
			anyBridge: true,
			durationSum: 8000,
			totalDuration: 8000,
			startedAt: new Date(1709123658789),
		});
	});

	it('should handle a mix of profiles with and without creation time', () => {
		const profiles: Record<string, IFreeSwitchChannelEventLegProfile> = {
			profile1: createTestProfile({
				profileIndex: '1',
				profileCreatedTime: new Date(1709123456789),
				channelCreatedTime: new Date(1709123456790),
				channelAnsweredTime: new Date(1709123456789),
				channelProgressTime: new Date(1709123456889),
				channelProgressMediaTime: new Date(1709123456989),
				channelBridgedTime: new Date(1709123456789),
				channelLastHold: new Date(1709123456789),
			}),
			profile2: createTestProfile({
				profileIndex: '2',
				channelCreatedTime: new Date(1709123456790),
				channelAnsweredTime: new Date(1709123656785),
			}),
			profile3: createTestProfile({
				profileIndex: '3',
				channelCreatedTime: new Date(1709123456790),
				channelAnsweredTime: new Date(1709123656785),
			}),
			profile4: createTestProfile({
				profileIndex: '4',
				profileCreatedTime: new Date(1709123656789),
				channelAnsweredTime: new Date(1709123657789),
				channelProgressTime: new Date(1709123657889),
				channelProgressMediaTime: new Date(1709123657989),
				channelBridgedTime: new Date(1709123658789),
				channelHangupTime: new Date(1709123666789),
				channelTransferTime: new Date(1709123656791),
				channelRessurectTime: new Date(1709123656792),
				channelLastHold: new Date(1709123456789),
			}),
		};

		const result = computeChannelProfiles(profiles);

		expect(result).toEqual({
			profiles: [
				{
					profileIndex: '1',
					profileCreatedTime: new Date(1709123456789),
					channelCreatedTime: new Date(1709123456790),
					channelAnsweredTime: new Date(1709123456789),
					channelProgressTime: new Date(1709123456889),
					channelProgressMediaTime: new Date(1709123456989),
					channelBridgedTime: new Date(1709123456789),
					channelLastHold: new Date(1709123456789),
					nextProfileCreatedTime: new Date(1709123656789),
					callDuration: 200000,
					answered: true,
					media: true,
					bridged: true,
				},
				{
					profileIndex: '4',
					profileCreatedTime: new Date(1709123656789),
					channelAnsweredTime: new Date(1709123657789),
					channelProgressTime: new Date(1709123657889),
					channelProgressMediaTime: new Date(1709123657989),
					channelBridgedTime: new Date(1709123658789),
					channelHangupTime: new Date(1709123666789),
					channelTransferTime: new Date(1709123656791),
					channelRessurectTime: new Date(1709123656792),
					callDuration: 8000,
					answered: true,
					media: true,
					bridged: true,
				},
				{
					channelCreatedTime: new Date(1709123456790),
					profileIndex: '2',
					bridged: false,
				},
				{
					channelCreatedTime: new Date(1709123456790),
					profileIndex: '3',
					bridged: false,
				},
			],
			anyMedia: true,
			anyAnswer: true,
			anyBridge: true,
			durationSum: 208000,
			totalDuration: 210000,
			startedAt: new Date(1709123456789),
		});
	});
});
