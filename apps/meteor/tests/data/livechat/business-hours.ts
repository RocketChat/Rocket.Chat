import { ILivechatBusinessHour } from '@rocket.chat/core-typings';
import { credentials, methodCall, request } from '../api-data';

export const saveBusinessHour = async (businessHour: ILivechatBusinessHour) => {
	await request
		.post(methodCall('livechat:saveBusinessHour'))
		.set(credentials)
		.send({ message: JSON.stringify({ params: [businessHour], msg: 'method', method: 'livechat:saveBusinessHour', id: '101' }) })
		.expect(200);
	return true;
};
