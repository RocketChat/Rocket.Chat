/* eslint-disable complexity */
import type { IFreeSwitchChannelEventLegProfile, IFreeSwitchChannelProfile } from '@rocket.chat/core-typings';

function adjustProfileTimestamps(profile: IFreeSwitchChannelEventLegProfile): IFreeSwitchChannelEventLegProfile {
	const { profileIndex, profileCreatedTime, channelCreatedTime, bridgedTo, caller, callee, ...timestamps } = profile;

	// Don't mutate anything if it's the first profile
	if (!profileIndex || profileIndex === '1') {
		return { ...profile };
	}

	const newProfile: IFreeSwitchChannelEventLegProfile = {
		channelCreatedTime,
		profileIndex,
		bridgedTo,
		callee,
		caller,
	};

	// If we don't know when the profile was created, drop every other timestamp
	if (!profileCreatedTime) {
		return newProfile;
	}

	newProfile.profileCreatedTime = profileCreatedTime;

	for (const key of Object.keys(timestamps)) {
		const value = timestamps[key as keyof typeof timestamps];
		if (!value || typeof value === 'string') {
			continue;
		}

		if (value < profileCreatedTime) {
			continue;
		}

		newProfile[key as keyof typeof timestamps] = value;
	}

	return newProfile;
}

type ProfileListAndSummary = {
	profiles: IFreeSwitchChannelProfile[];
	anyMedia: boolean;
	anyAnswer: boolean;
	anyBridge: boolean;
	durationSum: number;
	totalDuration: number;

	startedAt?: Date;
};

export function computeChannelProfiles(legProfiles: Record<string, IFreeSwitchChannelEventLegProfile>): ProfileListAndSummary {
	const profiles: IFreeSwitchChannelProfile[] = Object.values(legProfiles).map((profile) => adjustProfileTimestamps(profile));

	// Sort profiles by createdTime, temporarily filter out the ones that do not have one:
	const sortedProfiles = profiles
		.filter(
			({ profileCreatedTime, channelCreatedTime, profileIndex }) => profileCreatedTime || (profileIndex === '1' && channelCreatedTime),
		)
		.sort(
			({ profileCreatedTime: profile1, channelCreatedTime: channel1 }, { profileCreatedTime: profile2, channelCreatedTime: channel2 }) =>
				(profile1?.valueOf() || (channel1 as Date).valueOf()) - (profile2?.valueOf() || (channel2 as Date).valueOf()),
		);

	const adjustedProfiles: IFreeSwitchChannelProfile[] = [];
	let anyAnswer = false;
	let anyMedia = false;
	let anyBridge = false;
	let durationSum = 0;
	let firstProfileCreate: Date | undefined;
	// "first" because it's an array, but it's the same channel for all so there should only be one value
	let firstChannelCreate: Date | undefined;

	for (let i = 0; i < sortedProfiles.length; i++) {
		const nextProfileCreatedTime = sortedProfiles[i + 1]?.profileCreatedTime || undefined;

		const profile = sortedProfiles[i];

		const {
			channelBridgedTime,
			channelAnsweredTime,
			channelProgressMediaTime,
			channelHangupTime,
			bridgedTo,
			profileCreatedTime,
			channelCreatedTime,
		} = profile;

		const callEnd = channelHangupTime || nextProfileCreatedTime;

		if (channelCreatedTime && (!firstChannelCreate || firstChannelCreate > channelCreatedTime)) {
			firstChannelCreate = channelCreatedTime;
		}

		if (profileCreatedTime && (!firstProfileCreate || firstProfileCreate > profileCreatedTime)) {
			firstProfileCreate = profileCreatedTime;
		}

		const callDuration = callEnd && channelBridgedTime ? callEnd.valueOf() - channelBridgedTime.valueOf() : 0;
		const media = Boolean(channelProgressMediaTime) || sortedProfiles.length > 1;
		const answered = Boolean(channelAnsweredTime) || media;
		const bridged = Boolean(channelBridgedTime) || Boolean(bridgedTo);

		anyMedia ||= media;
		anyAnswer ||= answered;
		anyBridge ||= bridged;
		durationSum += callDuration;

		adjustedProfiles.push({
			...profile,
			...{
				nextProfileCreatedTime,
				callDuration,
				answered,
				media,
				bridged,
			},
		});
	}

	// Look for bridge and hangup on every channel, even if they didn't have a profile timestamp (in theory every profile will always have a created timestamp)
	let firstBridge: Date | undefined;
	let lastCallEnd: Date | undefined;
	for (const profile of profiles) {
		const { channelBridgedTime, channelHangupTime, nextProfileCreatedTime, bridgedTo } = profile;
		const callEnd = channelHangupTime || nextProfileCreatedTime;

		if (channelBridgedTime && (!firstBridge || firstBridge > channelBridgedTime)) {
			firstBridge = channelBridgedTime;
		}

		if ((callEnd || 0) > (lastCallEnd || 0)) {
			lastCallEnd = callEnd;
		}

		// If this profile was filtered out from the list used by the first process, add it back to the final list here
		if (!sortedProfiles.includes(profile)) {
			const bridged = Boolean(channelBridgedTime) || Boolean(bridgedTo);
			anyBridge ||= bridged;

			adjustedProfiles.push({ ...profile, ...{ bridged } });
		}
	}

	const firstCallStart = firstBridge || firstProfileCreate || firstChannelCreate;
	const totalDuration = lastCallEnd && firstCallStart ? lastCallEnd.valueOf() - firstCallStart.valueOf() : 0;

	return {
		profiles: adjustedProfiles,
		anyMedia,
		anyAnswer,
		anyBridge,
		durationSum,
		totalDuration,
		startedAt: firstCallStart,
	};
}
