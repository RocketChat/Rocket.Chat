import { api } from '@rocket.chat/core-services';
import { UserStatus } from '@rocket.chat/core-typings';
import type { ICalendarEvent, IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import { setupAppointmentStatusChange } from './setupAppointmentStatusChange';

export async function applyStatusChange({
	eventId,
	uid,
	startTime,
	endTime,
	status,
	shouldScheduleRemoval,
}: {
	eventId: ICalendarEvent['_id'];
	uid: IUser['_id'];
	startTime: Date;
	endTime?: Date;
	status?: UserStatus;
	shouldScheduleRemoval?: boolean;
}): Promise<void> {
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

	if (shouldScheduleRemoval && endTime) {
		await setupAppointmentStatusChange(eventId, uid, startTime, endTime, previousStatus, false);
	}
}
