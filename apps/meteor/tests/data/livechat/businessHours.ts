import { ILivechatBusinessHour, LivechatBusinessHourTypes } from "@rocket.chat/core-typings";
import { api, credentials, methodCall, request } from "../api-data";
import { updateEESetting, updateSetting } from "../permissions.helper"
import moment from "moment";

type ISaveBhApiWorkHour = Omit<ILivechatBusinessHour, '_id' | 'ts' | 'timezone'> & { workHours: { day: string, start: string, finish: string, open: boolean }[] } & { departmentsToApplyBusinessHour?: string } & { timezoneName: string };

// TODO: Migrate to an API call and return the business hour updated/created
export const saveBusinessHour = async (businessHour: ISaveBhApiWorkHour) => {
    const { body } = await request
        .post(methodCall('livechat:saveBusinessHour'))
        .set(credentials)
        .send({ message: JSON.stringify({ params: [businessHour], msg: 'method', method: 'livechat:saveBusinessHour', id: '101' }) })
        .expect(200);

    return JSON.parse(body.message);
};

export const createCustomBusinessHour = async (departments: string[], open = true): Promise<ILivechatBusinessHour> => {
    const name = `business-hour-${Date.now()}`;
    const businessHour: ISaveBhApiWorkHour = {
        name,
        active: true,
        type: LivechatBusinessHourTypes.CUSTOM,
        workHours: getWorkHours(open),
        timezoneName: 'Asia/Calcutta',
        departmentsToApplyBusinessHour: '',
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
	const { body: { businessHour } } = await request
		.get(api('livechat/business-hour?type=default'))
		.set(credentials)
		.send();

    // TODO: Refactor this to use openOrCloseBusinessHour() instead
	const workHours = businessHour.workHours as { start: string; finish: string; day: string, open: boolean }[];
	const allEnabledWorkHours = workHours.map((workHour) => {
		workHour.open = true;
		workHour.start = '00:00';
		workHour.finish = '00:01'; // if a job runs between 00:00 and 00:01, then this test will fail :P
		return workHour;
	});

	const enabledBusinessHour = {
		...businessHour,
		workHours: allEnabledWorkHours,
	}

	await request.post(methodCall('livechat:saveBusinessHour'))
		.set(credentials)
		.send({
			message: JSON.stringify({
				method: 'livechat:saveBusinessHour',
				params: [enabledBusinessHour],
				id: 'id',
				msg: 'method',
			}),
		});
}

export const disableDefaultBusinessHour = async () => {
	// disable settings
	await updateSetting('Livechat_enable_business_hours', false);
	await updateEESetting('Livechat_business_hour_type', 'Single');

	// create business hours
	const { body: { businessHour } } = await request
		.get(api('livechat/business-hour?type=default'))
		.set(credentials)
		.send();

    // TODO: Refactor this to use openOrCloseBusinessHour() instead
	const workHours = businessHour.workHours as { start: string; finish: string; day: string, open: boolean }[];
	const allDisabledWorkHours = workHours.map((workHour) => {
		workHour.open = false;
		workHour.start = '00:00';
		workHour.finish = '23:59';
		return workHour;
	});

	const disabledBusinessHour = {
		...businessHour,
		workHours: allDisabledWorkHours,
	}

	await request.post(methodCall('livechat:saveBusinessHour'))
		.set(credentials)
		.send({
			message: JSON.stringify({
				method: 'livechat:saveBusinessHour',
				params: [disabledBusinessHour],
				id: 'id',
				msg: 'method',
			}),
		});
}

export const removeCustomBusinessHour = async (businessHourId: string) => {
    await request
        .post(methodCall('livechat:removeBusinessHour'))
        .set(credentials)
        .send({ message: JSON.stringify({ params: [businessHourId, LivechatBusinessHourTypes.CUSTOM], msg: 'method', method: 'livechat:removeBusinessHour', id: '101' }) })
        .expect(200);
};

const getAllCustomBusinessHours = async (): Promise<ILivechatBusinessHour[]> => {
    const response = await request.get(api('livechat/business-hours')).set(credentials).expect(200);
    return (response.body.businessHours || []).filter((businessHour: ILivechatBusinessHour) => businessHour.type === LivechatBusinessHourTypes.CUSTOM);
};


export const removeAllCustomBusinessHours = async () => {
    const existingBusinessHours: ILivechatBusinessHour[] = await getAllCustomBusinessHours();

    const promises = existingBusinessHours.map((businessHour) => removeCustomBusinessHour(businessHour._id));
    await Promise.all(promises);
};

export const getDefaultBusinessHour = async (): Promise<ILivechatBusinessHour> => {
    const response = await request.get(api('livechat/business-hour')).set(credentials).query({ type: LivechatBusinessHourTypes.DEFAULT }).expect(200);
    return response.body.businessHour;
};

export const getCustomBusinessHourById = async (businessHourId: string): Promise<ILivechatBusinessHour> => {
    const response = await request.get(api('livechat/business-hour')).set(credentials).query({ type: LivechatBusinessHourTypes.CUSTOM, _id: businessHourId }).expect(200);
    return response.body.businessHour;
};

export const openOrCloseBusinessHour = async (businessHour: ILivechatBusinessHour, open: boolean) => {
    const enabledBusinessHour = {
        ...businessHour,
        timezoneName: businessHour.timezone.name,
        workHours: getWorkHours().map((workHour) => {
            return {
                ...workHour,
                open,
            }
        }),
        departmentsToApplyBusinessHour: businessHour.departments?.map((department) => department._id).join(',') || '',
    }

    await saveBusinessHour(enabledBusinessHour as any);
}

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
}
