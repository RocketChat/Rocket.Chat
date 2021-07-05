import { Meteor } from 'meteor/meteor';

import { OutOfOfficeUsers, OutOfOfficeRooms } from '../../models/server';

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

async function addUserAndRoomToCollection(
	userId: string,
	roomIds: string[],
): Promise<void> {
	await Promise.all(
		roomIds.map(async (roomId) => OutOfOfficeRooms.addUserIdAndRoomId({ userId, roomId })),
	).catch((e) => {
		console.log(
			'Error while adding user and room to OutOfOfficeRooms collection',
			e,
		);
	});
}

export function updateOutOfOffice({
	userId,
	customMessage,
	roomIds,
	startDate,
	endDate,
	isEnabled,
}: IUpdateOutOfOfficeParams): IUpdateOutOfOffice {
	if (!isEnabled) {
		const affected = OutOfOfficeUsers.setDisabled(userId);
		if (affected === 0) {
			// this will if the user had not enabled out-of-office before
			throw new Meteor.Error(
				'error-invalid-user',
				'Please enable out of office before disabling.',
			);
		}
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
			'The "startDate" and "endDate" must be  valid dates.',
		);
	}

	if (startDate && endDate && startDate > endDate) {
		throw new Meteor.Error(
			'error-invalid-date',
			'Your Start data has to be before the End Date',
		);
	}

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

	addUserAndRoomToCollection(userId, roomIds);

	return { message: 'Successfully Enabled Out Of Office' };
}
