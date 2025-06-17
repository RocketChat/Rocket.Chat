import { api } from '@rocket.chat/core-services';
import { UserStatus } from '@rocket.chat/core-typings';
import type { ICalendarEvent, IUser } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { Users } from '@rocket.chat/models';

const logger = new Logger('Calendar');

export async function applyStatusChange({
	eventId,
	uid,
	startTime,
	endTime,
	status,
}: {
	eventId: ICalendarEvent['_id'];
	uid: IUser['_id'];
	startTime: Date;
	endTime?: Date;
	status?: UserStatus;
	shouldScheduleRemoval?: boolean;
}): Promise<void> {
	logger.debug(`Applying status change for event ${eventId} at ${startTime} ${endTime ? `to ${endTime}` : ''} to ${status}`);

	const user = await Users.findOneById(uid, { projection: { roles: 1, username: 1, name: 1, status: 1 } });
	if (!user || user.status === UserStatus.OFFLINE) {
		return;
	}

	const newStatus = status ?? UserStatus.BUSY;
	const previousStatus = user.status;

	await Users.updateStatusAndStatusDefault(uid, newStatus, newStatus);

	await api.broadcast('presence.status', {
		user: {
			status: newStatus,
			_id: uid,
			roles: user.roles,
			username: user.username,
			name: user.name,
		},
		previousStatus,
	});
}
