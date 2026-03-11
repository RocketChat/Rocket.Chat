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
	const user = await Users.findOneById(uid, { projection: { roles: 1, username: 1, name: 1, statusDefault: 1 } });

	if (!user || user.statusDefault === UserStatus.OFFLINE) {
		logger.debug({
			msg: 'Cannot apply status change for event, user is offline or does not exist',
			eventId,
			uid,
		});

		return;
	}

	const newStatus = status ?? UserStatus.BUSY;
	const previousStatus = user.statusDefault;

	logger.debug({
		msg: 'Applying status change for event',
		eventId,
		user: { _id: uid, statusDefault: user?.statusDefault },
		startTime,
		endTime,
		newStatus,
		previousStatus,
	});

	let statusChanged = false;

	if (newStatus === UserStatus.BUSY) {
		await Users.updateStatusAndStatusDefault(uid, newStatus, newStatus);
		statusChanged = true;
	} else if (user.statusDefault === UserStatus.BUSY) {
		await Users.updateStatusAndStatusDefault(uid, newStatus, newStatus);
		statusChanged = true;
	}

	if (statusChanged) {
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
}
