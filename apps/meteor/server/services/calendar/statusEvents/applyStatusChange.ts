import { Presence } from '@rocket.chat/core-services';
import { UserStatus } from '@rocket.chat/core-typings';
import type { ICalendarEvent, IUser } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';

const logger = new Logger('Calendar');

export async function applyStatusChange({
	eventId,
	uid,
	subject,
	endTime,
}: {
	eventId: ICalendarEvent['_id'];
	uid: IUser['_id'];
	subject?: string;
	endTime?: Date;
}): Promise<void> {
	logger.debug({
		msg: 'Applying status change for event via presence engine',
		eventId,
		uid,
		subject,
		endTime,
	});

	await Presence.setActiveState(uid, {
		statusDefault: UserStatus.BUSY,
		statusText: subject ?? '',
		statusSource: 'external',
		statusEmoji: '📅',
		...(endTime && { statusExpiresAt: endTime }),
	});
}
