import faker from '@faker-js/faker';
import { ILivechatPriority, ILivechatPriorityData, IOmnichannelServiceLevelAgreements } from '@rocket.chat/core-typings';
import { api, credentials, methodCall, request } from '../api-data';
import { DummyResponse } from './utils';

export const savePriority = (override:ILivechatPriorityData={name:"",level:""}): Promise<ILivechatPriority> => {
    return new Promise((resolve, reject) => {
		request
			.post(api(`livechat/priority`))
			.set(credentials)
			.send({
				name: override.name || faker.name.firstName(),
				level: override.level || faker.name.lastName(),
			})
			.end((err: Error, res: DummyResponse<ILivechatPriority,'not-wrapped'>) => {
				if (err) {
					return reject(err);
				}
				resolve(res.body as ILivechatPriority);
			});
	});
};


export const saveSLA = (): Promise<IOmnichannelServiceLevelAgreements> => {
    return new Promise((resolve, reject) => {
		request
			.post(methodCall(`livechat:saveSLA`))
			.set(credentials)
			.send({
				message: JSON.stringify({
					method: 'livechat:saveSLA',
					params: [undefined, { name: faker.name.firstName(), description: faker.lorem.sentence(), dueTimeInMinutes: `${faker.datatype.number({ min: 10 })}` }],
					id: '101',
					msg: 'method',
				}),
			})
			.end((err: Error, res: DummyResponse<string, 'wrapped'>) => {
				if (err) {
					return reject(err);
				}
				resolve(JSON.parse(res.body.message).result);
			});
	});
};
