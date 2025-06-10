import type { IFreeSwitchChannelEventLegProfile, IFreeSwitchChannelProfile } from '@rocket.chat/core-typings';

function adjustProfileTimestamps(profile: IFreeSwitchChannelEventLegProfile): IFreeSwitchChannelEventLegProfile {
	const { profileIndex, profileCreatedTime, bridgedTo, callee, caller, ...timestamps } = profile;

	// Don't mutate anything if it's the first profile
	if (!profileIndex || profileIndex === '1') {
		return { ...profile };
	}

	const newProfile: IFreeSwitchChannelEventLegProfile = {
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

	for (const key in timestamps) {
		if (!(key in timestamps)) {
			continue;
		}

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

export function computeChannelProfiles(
	legProfiles: Record<string, IFreeSwitchChannelEventLegProfile>,
): Record<string, IFreeSwitchChannelProfile> {
	const profiles: Record<string, IFreeSwitchChannelProfile> = Object.fromEntries(
		Object.entries(legProfiles).map(([key, profile]) => [key, adjustProfileTimestamps(profile)]),
	);

	// Sort profiles by createdTime:
	const sortedProfiles = Object.values(profiles)
		.filter(({ profileCreatedTime }) => profileCreatedTime)
		.sort(({ profileCreatedTime: profile1 }, { profileCreatedTime: profile2 }) => (profile1?.valueOf() || 0) - (profile2?.valueOf() || 0));

	// From the first to the penultimate, set nextProfileCreatedTime to the profileCreatedTime of the next
	for (let i = 0; i < sortedProfiles.length - 1; i++) {
		sortedProfiles[i].nextProfileCreatedTime = sortedProfiles[i + 1].profileCreatedTime;
	}

	return profiles;
}
