import { api, MeteorError } from '@rocket.chat/core-services';
import { expect } from 'chai';
import { before, describe } from 'mocha';

import { BeforeSaveCheckMAC } from '../../../../../../server/services/messages/hooks/BeforeSaveCheckMAC';
import { BrokerMocked } from '../../../../../mocks/server/BrokerMocked';

const createMessage = (msg?: string, extra: any = {}) => ({
	_id: 'random',
	rid: 'GENERAL',
	ts: new Date(),
	u: {
		_id: 'userId',
		username: 'username',
	},
	_updatedAt: new Date(),
	msg: msg as string,
	...extra,
});

const createRoom = (extra: any = {}): any => ({
	_id: 'GENERAL',
	t: 'c',
	u: {
		_id: 'userId',
		username: 'username',
		name: 'name',
	},
	msgs: 1,
	usersCount: 1,
	_updatedAt: new Date(),
	...extra,
});

const broker = new BrokerMocked();

describe('Check MAC', () => {
	before(() => {
		api.setBroker(broker);
	});

	it('should do nothing if not omnichannel room', async () => {
		const checkMAC = new BeforeSaveCheckMAC();

		const empty = await checkMAC.isWithinLimits({
			message: createMessage('hey'),
			room: createRoom(),
		});

		expect(empty).to.not.have.value;
	});

	it('should do nothing if message from visitor', async () => {
		const checkMAC = new BeforeSaveCheckMAC();

		const empty = await checkMAC.isWithinLimits({
			message: createMessage('hey', { token: 'hash' }),
			room: createRoom({ t: 'l' }),
		});

		expect(empty).to.not.have.value;
	});

	it('should do nothing if it is a system message', async () => {
		const checkMAC = new BeforeSaveCheckMAC();

		const empty = await checkMAC.isWithinLimits({
			message: createMessage('hey', { t: 'uj' }),
			room: createRoom({ t: 'l' }),
		});

		expect(empty).to.not.have.value;
	});

	it('should throw an error if not within limits', () => {
		const checkMAC = new BeforeSaveCheckMAC();

		broker.mockServices({
			'omnichannel.isWithinMACLimit': async () => false,
		});

		void expect(
			checkMAC.isWithinLimits({
				message: createMessage('hey'),
				room: createRoom({ t: 'l' }),
			}),
		).to.be.rejectedWith(MeteorError, 'error-mac-limit-reached');
	});

	it('should work if MAC within limits', async () => {
		const checkMAC = new BeforeSaveCheckMAC();

		broker.mockServices({
			'omnichannel.isWithinMACLimit': async () => true,
		});

		const empty = await checkMAC.isWithinLimits({
			message: createMessage('hey'),
			room: createRoom({ t: 'l' }),
		});

		expect(empty).to.not.have.value;
	});
});
