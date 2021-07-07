import { Meteor } from 'meteor/meteor';

import { OutOfOffice } from '../../models/server';

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

export function updateOutOfOffice({
	userId,
	customMessage,
	roomIds,
	startDate,
	endDate,
	isEnabled,
}: IUpdateOutOfOfficeParams): IUpdateOutOfOffice {
	if (!isEnabled) {
		const affected = OutOfOffice.setDisabled(userId);
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
		throw new Meteor.Error('error-invalid-date', 'The "startDate" and "endDate" must be  valid dates.');
	}

	if (startDate && endDate && startDate > endDate) {
		throw new Meteor.Error('error-invalid-date', 'Your Start data has to be before the End Date');
	}

	(Promise as any).await( Promise.all(roomIds.map(async roomId=>{
		 OutOfOffice.createWithFullOutOfOfficeData({
			userId,
			startDate,
			endDate,
			customMessage,
			isEnabled,
			roomId,
		});
		
	})).catch(e=>{
		throw new Meteor.Error('error-database-error',JSON.stringify(e));
	}));

	// the dummy data

	OutOfOffice.createWithFullOutOfOfficeData({userId,startDate,endDate,customMessage,isEnabled,roomId:null} as any)
	
	return { message: 'Successfully Enabled Out Of Office' };
}
