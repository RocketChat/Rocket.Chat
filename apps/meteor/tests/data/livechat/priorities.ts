import { api, credentials, request } from '../api-data';
import type { DummyResponse } from './utils';
import { expect } from 'chai';
import { generateRandomSLAData } from '../../e2e/utils/omnichannel/sla';
import type { ILivechatPriority, IOmnichannelServiceLevelAgreements } from '@rocket.chat/core-typings';

export const createSLA = (): Promise<Omit<IOmnichannelServiceLevelAgreements, '_updated'>> => {
	return new Promise((resolve, reject) => {
		request
			.post(api('livechat/sla'))
			.set(credentials)
			.send(generateRandomSLAData())
			.end((err: Error, res: DummyResponse<{ sla: Omit<IOmnichannelServiceLevelAgreements, '_updated'> }, 'unwrapped'>) => {
				if (err) {
					return reject(err);
				}
				resolve(res.body.sla);
			});
	});
};

export const deleteSLA = (id: string): Promise<void> => {
	return new Promise((resolve, reject) => {
		request
			.delete(api(`livechat/sla/${id}`))
			.set(credentials)
			.send()
			.end((err: Error, _res: DummyResponse<void, 'not-wrapped'>) => {
				if (err) {
					return reject(err);
				}
				resolve();
			});
	});
};

export const bulkCreateSLA = (amount: number): Promise<Omit<IOmnichannelServiceLevelAgreements, '_updated'>[]> => {
	const promises = [];
	for (let i = 0; i < amount; i++) {
		promises.push(createSLA());
	}
	return Promise.all(promises);
};

export const deleteAllSLA = async (): Promise<void> => {
	const response = await request.get(api('livechat/sla')).set(credentials).expect('Content-Type', 'application/json').expect(200);
	expect(response.body).to.have.property('success', true);
	expect(response.body.sla).to.be.an('array');
	const {
		body: { sla },
	} = response as { body: { sla: IOmnichannelServiceLevelAgreements[] } };
	const promises = sla.map((slaObj) =>
		request
			.delete(api(`livechat/sla/${slaObj._id}`))
			.set(credentials)
			.expect('Content-Type', 'application/json')
			.expect(200),
	);
	await Promise.all(promises);
};

export const getRandomPriority = async (): Promise<ILivechatPriority> => {
	const response = await request.get(api('livechat/priorities')).set(credentials).expect('Content-Type', 'application/json').expect(200);
	expect(response.body).to.have.property('success', true);
	expect(response.body.priorities).to.be.an('array');
	const {
		body: { priorities },
	} = response as { body: { priorities: ILivechatPriority[] } };
	return priorities[Math.floor(Math.random() * priorities.length)];
}
