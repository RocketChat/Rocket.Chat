import { Meteor } from 'meteor/meteor';

import { OutOfOfficeUsers } from '../../models/server';
import { outOfOfficeScheduler } from './scheduler';
import { removeUserIdInPresentRooms } from './lib';

interface IUpdateOutOfOfficeParams {
	userId: string;
	roomIds: string[];
	customMessage: string;
	startDate: string;
	endDate: string;
	isEnabled: boolean;
}

interface IUpdateOutOfOffice {
	message: string;
}

export async function updateOutOfOffice({
	userId,
	customMessage,
	roomIds,
	startDate,
	endDate,
	isEnabled,
}: IUpdateOutOfOfficeParams): Promise<IUpdateOutOfOffice> {
	if (!isEnabled) {
		const affected = OutOfOfficeUsers.setDisabled(userId);
		if (affected === 0) {
			// this will happen if the user had not enabled out-of-office before
			throw new Meteor.Error(
				'error-invalid-user',
				'Please enable out of office before disabling.',
			);
		}

		removeUserIdInPresentRooms(userId);
		outOfOfficeScheduler.cancelScheduledByUser(userId);
		return { message: 'Successfully Disabled Out Of Office.' };
	}

	if (customMessage.length === 0) {
		throw new Meteor.Error(
			'error-invalid-params',
			'The custom message is mandatory',
		);
	}

	if (isNaN(Date.parse(startDate)) || isNaN(Date.parse(endDate))) {
		throw new Meteor.Error(
			'error-invalid-date',
			'The "startDate" and "endDate" must be valid dates.',
		);
	}

	if (startDate > endDate) {
		throw new Meteor.Error(
			'error-invalid-date',
			'Your Start Date has to be before the End Date.',
		);
	}

	const currentDate = new Date().toISOString();
	if (endDate < currentDate) {
		throw new Meteor.Error('error-invalid-date', 'The "startDate" and "endDate" must be after the current date');
	}

	await outOfOfficeScheduler.scheduleEnable({ when: startDate, userId, roomIds });
	await outOfOfficeScheduler.scheduleDisable({ when: endDate, userId });

	const upsertResult = OutOfOfficeUsers.createWithFullOutOfOfficeData({
		userId,
		startDate,
		endDate,
		customMessage,
		isEnabled,
		roomIds,
	});

	if (!upsertResult || upsertResult.numberAffected !== 1) {
		throw new Meteor.Error('error-database-error');
	}

	return { message: 'Successfully Enabled Out Of Office.' };
}
