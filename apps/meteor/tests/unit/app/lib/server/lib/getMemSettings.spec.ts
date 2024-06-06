import type { MessageTypesValues } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const getValueByIdStub = sinon.stub();
const { getSettingCached } = proxyquire.noCallThru().load('../../../../../../app/lib/server/lib/getMemSettings', {
	'@rocket.chat/models': {
		Settings: {
			getValueById: getValueByIdStub,
		},
	},
	'mem': (fn: any, _options: any) => fn,
});

describe('getSettingCached', () => {
	beforeEach(() => {
		getValueByIdStub.reset();
	});

	it('should return hidden system messages from settings', async () => {
		const hiddenMessages: MessageTypesValues[] = ['user-muted', 'user-unmuted'];
		getValueByIdStub.withArgs('Hide_System_Messages').resolves(hiddenMessages);

		const result = await getSettingCached('Hide_System_Messages');
		expect(result).to.deep.equal(hiddenMessages);
	});

	it('should return undefined if no settings found', async () => {
		getValueByIdStub.withArgs('Hide_System_Messages').resolves(undefined);

		const result = await getSettingCached('Hide_System_Messages');
		expect(result).to.deep.equal(undefined);
	});
});
