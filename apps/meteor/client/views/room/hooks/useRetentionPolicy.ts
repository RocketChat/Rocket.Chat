import type { IRoom, IRoomWithRetentionPolicy } from '@rocket.chat/core-typings';
import { useSetting } from '@rocket.chat/ui-contexts';

import { TIMEUNIT, isValidTimespan, timeUnitToMs } from '../../../lib/convertTimeUnit';

const hasRetentionPolicy = (room: IRoom & { retention?: any }): room is IRoomWithRetentionPolicy =>
	'retention' in room && room.retention !== undefined;

const isRetentionOverridden = (room: IRoom & { retention?: any }) => 'overrideGlobal' in room.retention && room.retention.overrideGlobal;

type RetentionPolicySettings = {
	enabled: boolean;
	filesOnly: boolean;
	doNotPrunePinned: boolean;
	ignoreThreads: boolean;
	appliesToChannels: boolean;
	maxAgeChannels: number;
	appliesToGroups: boolean;
	maxAgeGroups: number;
	appliesToDMs: boolean;
	maxAgeDMs: number;
};

const isActive = (room: IRoom, { enabled, appliesToChannels, appliesToGroups, appliesToDMs }: RetentionPolicySettings): boolean => {
	if (!enabled) {
		return false;
	}

	if (hasRetentionPolicy(room) && room.retention.enabled !== undefined) {
		return room.retention.enabled;
	}

	switch (room.t) {
		case 'c':
			return appliesToChannels;
		case 'p':
			return appliesToGroups;
		case 'd':
			return appliesToDMs;
	}

	return false;
};

const extractFilesOnly = (room: IRoom, { filesOnly }: RetentionPolicySettings): boolean => {
	if (hasRetentionPolicy(room) && isRetentionOverridden(room)) {
		return room.retention.filesOnly;
	}

	return filesOnly;
};

const extractExcludePinned = (room: IRoom, { doNotPrunePinned }: RetentionPolicySettings): boolean => {
	if (hasRetentionPolicy(room) && isRetentionOverridden(room)) {
		return room.retention.excludePinned;
	}

	return doNotPrunePinned;
};

const extractIgnoreThreads = (room: IRoom, { ignoreThreads }: RetentionPolicySettings): boolean => {
	if (hasRetentionPolicy(room) && isRetentionOverridden(room)) {
		return room.retention.ignoreThreads;
	}

	return ignoreThreads;
};

const getMaxAge = (room: IRoom, { maxAgeChannels, maxAgeGroups, maxAgeDMs }: RetentionPolicySettings): number => {
	if (hasRetentionPolicy(room) && isRetentionOverridden(room) && isValidTimespan(room.retention.maxAge)) {
		return timeUnitToMs(TIMEUNIT.days, room.retention.maxAge);
	}

	if (room.t === 'c') {
		return maxAgeChannels;
	}
	if (room.t === 'p') {
		return maxAgeGroups;
	}
	if (room.t === 'd') {
		return maxAgeDMs;
	}

	return -Infinity;
};

export const useRetentionPolicy = (
	room: IRoom | undefined,
):
	| {
			enabled: boolean;
			isActive: boolean;
			filesOnly: boolean;
			excludePinned: boolean;
			ignoreThreads: boolean;
			maxAge: number;
	  }
	| undefined => {
	const settings = {
		enabled: useSetting('RetentionPolicy_Enabled') as boolean,
		filesOnly: useSetting('RetentionPolicy_FilesOnly') as boolean,
		doNotPrunePinned: useSetting('RetentionPolicy_DoNotPrunePinned') as boolean,
		ignoreThreads: useSetting('RetentionPolicy_DoNotPruneThreads') as boolean,
		appliesToChannels: useSetting('RetentionPolicy_AppliesToChannels') as boolean,
		maxAgeChannels: useSetting('RetentionPolicy_TTL_Channels') as number,
		appliesToGroups: useSetting('RetentionPolicy_AppliesToGroups') as boolean,
		maxAgeGroups: useSetting('RetentionPolicy_TTL_Groups') as number,
		appliesToDMs: useSetting('RetentionPolicy_AppliesToDMs') as boolean,
		maxAgeDMs: useSetting('RetentionPolicy_TTL_DMs') as number,
	} as const;

	if (!room) {
		return undefined;
	}

	return {
		enabled: settings.enabled,
		isActive: isActive(room, settings),
		filesOnly: extractFilesOnly(room, settings),
		excludePinned: extractExcludePinned(room, settings),
		ignoreThreads: extractIgnoreThreads(room, settings),
		maxAge: getMaxAge(room, settings),
	};
};
