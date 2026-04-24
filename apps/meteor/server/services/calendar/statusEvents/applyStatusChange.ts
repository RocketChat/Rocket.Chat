import { Presence } from '@rocket.chat/core-services';
import { UserStatus } from '@rocket.chat/core-typings';
import type { ICalendarEvent, IUser } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';

const logger = new Logger('Calendar');

export async function applyStatusChange({
	eventId,
	uid,
	endTime,
}: {
	eventId: ICalendarEvent['_id'];
	uid: IUser['_id'];
	endTime?: Date;
}): Promise<void> {
	logger.debug({
		msg: 'Applying status change for event via presence engine',
		eventId,
		uid,
		endTime,
	});

	await Presence.setActiveState(uid, {
		statusDefault: UserStatus.BUSY,
		statusText: '',
		statusSource: 'external',
		statusEmoji: '📅',
		...(endTime && { statusExpiresAt: endTime }),
	});
}
