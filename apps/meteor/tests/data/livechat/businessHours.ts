import type { ILivechatBusinessHour } from '@rocket.chat/core-typings';
import { LivechatBusinessHourTypes } from '@rocket.chat/core-typings';
import type { POSTLivechatBusinessHoursSaveParams } from '@rocket.chat/rest-typings';
import moment from 'moment';

import { api, credentials, request } from '../api-data';
import { updateEESetting, updateSetting } from '../permissions.helper';

type ISaveBhApiWorkHour = Omit<ILivechatBusinessHour, '_id' | 'ts' | 'timezone'> & {
	workHours: { day: string; start: string; finish: string; open: boolean }[];
} & { departmentsToApplyBusinessHour?: string } & { timezoneName: string };

export const saveBusinessHour = async (businessHour: POSTLivechatBusinessHoursSaveParams) => {
	const { body } = await request.post(api('livechat/business-hours.save')).set(credentials).send(businessHour);

	return body;
};

export const createCustomBusinessHour = async (departments: string[], open = true): Promise<ILivechatBusinessHour> => {
	const name = `business-hour-${Date.now()}`;
	const businessHour: POSTLivechatBusinessHoursSaveParams = {
		name,
		active: true,
		type: LivechatBusinessHourTypes.CUSTOM,
		workHours: getWorkHours(open),
		timezoneName: 'Asia/Calcutta',
		timezone: 'Asia/Calcutta',
		departmentsToApplyBusinessHour: '',
		daysOpen: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
		daysTime: [
			{ day: 'Monday', start: { time: '08:00' }, finish: { time: '18:00' }, open },
			{ day: 'Tuesday', start: { time: '08:00' }, finish: { time: '18:00' }, open },
			{ day: 'Wednesday', start: { time: '08:00' }, finish: { time: '18:00' }, open },
			{ day: 'Thursday', start: { time: '08:00' }, finish: { time: '18:00' }, open },
			{ day: 'Friday', start: { time: '08:00' }, finish: { time: '18:00' }, open },
		],
	};

	if (departments.length) {
		businessHour.departmentsToApplyBusinessHour = departments.join(',');
	}

	await saveBusinessHour(businessHour);

	const existingBusinessHours: ILivechatBusinessHour[] = await getAllCustomBusinessHours();
	const createdBusinessHour = existingBusinessHours.find((bh) => bh.name === name);
	if (!createdBusinessHour) {
		throw new Error('Could not create business hour');
	}

	return createdBusinessHour;
};

export const makeDefaultBusinessHourActiveAndClosed = async () => {
	// enable settings
	await updateSetting('Livechat_enable_business_hours', true);
	await updateEESetting('Livechat_business_hour_type', 'Single');

	// create business hours
	const {
		body: { businessHour },
	} = await request.get(api('livechat/business-hour')).query({ type: 'default' }).set(credentials).send();

	const { workHours } = businessHour;

	// Remove properties not accepted by the endpoint schema
	const { _updatedAt, ts, ...cleanedBusinessHour } = businessHour;

	const enabledBusinessHour = {
		...cleanedBusinessHour,
		timezoneName: 'America/Sao_Paulo',
		timezone: 'America/Sao_Paulo',
		departmentsToApplyBusinessHour: '',
		daysOpen: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
		daysTime: workHours.map((workHour: { open: boolean; start: { time: string }; finish: { time: string }; day: string }) => {
			return {
				open: true,
				start: { time: '00:00' },
				finish: { time: '00:01' },
				day: workHour.day,
			};
		}),
		workHours: workHours.map((workHour: { open: boolean; start: string; finish: string; day: string; code?: number }) => {
			workHour.open = true;
			workHour.start = '00:00';
			workHour.finish = '00:01'; // if a job runs between 00:00 and 00:01, then this test will fail :P
			delete workHour.code;
			return workHour;
		}),
	};

	return request.post(api('livechat/business-hours.save')).set(credentials).send(enabledBusinessHour).expect(200);
};

export const disableDefaultBusinessHour = async () => {
	// disable settings
	await updateSetting('Livechat_enable_business_hours', false);
	await updateEESetting('Livechat_business_hour_type', 'Single');

	// create business hours
	const {
		body: { businessHour },
	} = await request.get(api('livechat/business-hour')).query({ type: 'default' }).set(credentials).send();

	const { workHours } = businessHour;

	// Remove properties not accepted by the endpoint schema
	const { _updatedAt, ts, ...cleanedBusinessHour } = businessHour;
	const disabledBusinessHour = {
		...cleanedBusinessHour,
		timezoneName: 'America/Sao_Paulo',
		timezone: 'America/Sao_Paulo',
		departmentsToApplyBusinessHour: '',
		daysOpen: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
		daysTime: workHours.map((workHour: { open: boolean; start: { time: string }; finish: { time: string }; day: string }) => {
			return {
				open: false,
				start: { time: '00:00' },
				finish: { time: '23:59' },
				day: workHour.day,
			};
		}),
		workHours: workHours.map((workHour: { open: boolean; start: string; finish: string; day: string }) => {
			workHour.open = false;
			workHour.start = '00:00';
			workHour.finish = '23:59';
			return workHour;
		}),
	};

	return request.post(api('livechat/business-hours.save')).set(credentials).send(disabledBusinessHour).expect(200);
};

const removeCustomBusinessHour = async (businessHourId: string) => {
	return request
		.post(api('livechat/business-hours.remove'))
		.set(credentials)
		.send({ _id: businessHourId, type: LivechatBusinessHourTypes.CUSTOM })
		.expect(200);
};

const getAllCustomBusinessHours = async (): Promise<ILivechatBusinessHour[]> => {
	const response = await request.get(api('livechat/business-hours')).set(credentials).expect(200);
	return (response.body.businessHours || []).filter(
		(businessHour: ILivechatBusinessHour) => businessHour.type === LivechatBusinessHourTypes.CUSTOM,
	);
};

export const removeAllCustomBusinessHours = async () => {
	const existingBusinessHours: ILivechatBusinessHour[] = await getAllCustomBusinessHours();

	const promises = existingBusinessHours.map((businessHour) => removeCustomBusinessHour(businessHour._id));
	await Promise.all(promises);
};

export const getDefaultBusinessHour = async (): Promise<ILivechatBusinessHour> => {
	const response = await request
		.get(api('livechat/business-hour'))
		.set(credentials)
		.query({ type: LivechatBusinessHourTypes.DEFAULT })
		.expect(200);
	return response.body.businessHour;
};

export const getCustomBusinessHourById = async (businessHourId: string): Promise<ILivechatBusinessHour> => {
	const response = await request
		.get(api('livechat/business-hour'))
		.set(credentials)
		.query({ type: LivechatBusinessHourTypes.CUSTOM, _id: businessHourId })
		.expect(200);
	return response.body.businessHour;
};

// TODO: Refactor logic so object passed is of the correct type for POST /livechat/business-hours.save. See: CORE-1552
export const openOrCloseBusinessHour = async (businessHour: ILivechatBusinessHour, open: boolean) => {
	const { _updatedAt, ts, ...cleanedBusinessHour } = businessHour;
	const timezoneName = businessHour.timezone.name;

	const enabledBusinessHour = {
		...cleanedBusinessHour,
		timezoneName,
		timezone: timezoneName,
		workHours: getWorkHours().map((workHour) => {
			return {
				...workHour,
				open,
			};
		}),
		departmentsToApplyBusinessHour: businessHour.departments?.map((department) => department._id).join(',') || '',
	};

	await saveBusinessHour(enabledBusinessHour as any);
};

export const getWorkHours = (open = true): ISaveBhApiWorkHour['workHours'] => {
	const workHours: ISaveBhApiWorkHour['workHours'] = [];

	for (let i = 0; i < 7; i++) {
		workHours.push({
			day: moment().day(i).format('dddd'),
			start: '00:00',
			finish: '23:59',

			open,
		});
	}

	return workHours;
};
