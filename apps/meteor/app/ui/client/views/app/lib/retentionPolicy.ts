import type { IRoom, IRoomWithRetentionPolicy } from '@rocket.chat/core-typings';
import moment from 'moment';

import { settings } from '../../../../../settings/client';

function roomHasGlobalPurge(room: IRoom): boolean {
	if (!settings.get('RetentionPolicy_Enabled')) {
		return false;
	}

	switch (room.t) {
		case 'c':
			return settings.get('RetentionPolicy_AppliesToChannels');
		case 'p':
			return settings.get('RetentionPolicy_AppliesToGroups');
		case 'd':
			return settings.get('RetentionPolicy_AppliesToDMs');
	}

	return false;
}

const hasRetentionPolicy = (room: IRoom): room is IRoomWithRetentionPolicy => 'retention' in room;

function roomHasPurge(room: IRoom): boolean {
	if (!room || !settings.get('RetentionPolicy_Enabled')) {
		return false;
	}

	if (hasRetentionPolicy(room) && room.retention.enabled !== undefined) {
		return room.retention.enabled;
	}

	return roomHasGlobalPurge(room);
}

function roomFilesOnly(room: IRoom): boolean {
	if (!room) {
		return false;
	}

	if (hasRetentionPolicy(room) && room.retention.overrideGlobal) {
		return room.retention.filesOnly;
	}

	return settings.get('RetentionPolicy_FilesOnly');
}

function roomExcludePinned(room: IRoom): boolean {
	if (!room) {
		return false;
	}

	if (hasRetentionPolicy(room) && room.retention.overrideGlobal) {
		return room.retention.excludePinned;
	}

	return settings.get('RetentionPolicy_DoNotPrunePinned');
}

function roomMaxAge(room: IRoom): number | undefined {
	if (!room) {
		return;
	}

	if (!roomHasPurge(room)) {
		return;
	}

	if (hasRetentionPolicy(room) && room.retention.overrideGlobal) {
		return room.retention.maxAge;
	}

	if (room.t === 'c') {
		return settings.get('RetentionPolicy_MaxAge_Channels');
	}
	if (room.t === 'p') {
		return settings.get('RetentionPolicy_MaxAge_Groups');
	}
	if (room.t === 'd') {
		return settings.get('RetentionPolicy_MaxAge_DMs');
	}
}

export const retentionPolicyHelpers = {
	hasPurge() {
		const { room } = Template.instance() as unknown as { room: IRoom };
		return roomHasPurge(room);
	},
	filesOnly() {
		const { room } = Template.instance() as unknown as { room: IRoom };
		return roomFilesOnly(room);
	},
	excludePinned() {
		const { room } = Template.instance() as unknown as { room: IRoom };
		return roomExcludePinned(room);
	},
	purgeTimeout() {
		const { room } = Template.instance() as unknown as { room: IRoom };
		const maxAge = roomMaxAge(room);

		if (!maxAge) {
			return undefined;
		}

		moment.relativeTimeThreshold('s', 60);
		moment.relativeTimeThreshold('ss', 0);
		moment.relativeTimeThreshold('m', 60);
		moment.relativeTimeThreshold('h', 24);
		moment.relativeTimeThreshold('d', 31);
		moment.relativeTimeThreshold('M', 12);

		return moment.duration(maxAge * 1000 * 60 * 60 * 24).humanize();
	},
} as const;
