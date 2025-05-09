import { Emitter } from '@rocket.chat/emitter';
import { registerModel } from '@rocket.chat/models';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

let promises: Array<Promise<any>> = [];

class AirgappedRestriction extends Emitter<{ remainingDays: { days: number } }> {
	computeRestriction = sinon.spy();

	isWarningPeriod = sinon.stub();

	on(type: any, cb: any): any {
		const newCb = (...args: any) => {
			promises.push(cb(...args));
		};
		return super.on(type, newCb);
	}
}

const airgappedRestrictionObj = new AirgappedRestriction();

const mocks = {
	sendMessagesToAdmins: ({ msgs }: any) => {
		msgs({ adminUser: { language: 'pt-br' } });
	},
	settingsUpdate: sinon.spy(),
	notifySetting: sinon.spy(),
	i18n: sinon.spy(),
	findLastToken: sinon.stub(),
};

const licenseMock = {
	validateCb: async () => undefined,
	removeCb: async () => undefined,
	onValidateLicense: async (cb: any) => {
		licenseMock.validateCb = cb;
	},
	onRemoveLicense: async (cb: any) => {
		licenseMock.removeCb = cb;
	},
};

registerModel('IServerEventsModel', {
	insertOne: () => undefined,
	createAuditServerEvent: () => undefined,
} as any);

proxyquire.noCallThru().load('../../../../app/license/server/airGappedRestrictions.ts', {
	'@rocket.chat/license': {
		AirGappedRestriction: airgappedRestrictionObj,
		License: licenseMock,
	},
	'@rocket.chat/models': {
		Settings: {
			updateValueById: mocks.settingsUpdate,
		},
		Statistics: {
			findLastStatsToken: mocks.findLastToken,
		},
	},
	'../../../../app/lib/server/lib/notifyListener': {
		notifyOnSettingChangedById: mocks.notifySetting,
	},
	'../../../../server/lib/i18n': {
		i18n: {
			t: mocks.i18n,
		},
	},
	'../../../../server/lib/sendMessagesToAdmins': {
		sendMessagesToAdmins: mocks.sendMessagesToAdmins,
	},
});

describe('airgappedRestrictions', () => {
	afterEach(() => {
		Object.values(mocks).forEach((mock) => {
			if ('resetHistory' in mock) {
				mock.resetHistory();
			}
			if ('reset' in mock) {
				mock.reset();
			}
		});
		airgappedRestrictionObj.computeRestriction.resetHistory();
		airgappedRestrictionObj.isWarningPeriod.reset();
		promises = [];
	});
	it('should update setting when restriction is removed', async () => {
		airgappedRestrictionObj.emit('remainingDays', { days: -1 });

		await Promise.all(promises);
		expect(mocks.settingsUpdate.calledWith('Cloud_Workspace_AirGapped_Restrictions_Remaining_Days', -1)).to.be.true;
		expect(mocks.notifySetting.calledWith('Cloud_Workspace_AirGapped_Restrictions_Remaining_Days')).to.be.true;
		expect(airgappedRestrictionObj.isWarningPeriod.called).to.be.false;
	});

	it('should update setting when restriction is applied', async () => {
		airgappedRestrictionObj.emit('remainingDays', { days: 0 });

		await Promise.all(promises);
		expect(mocks.settingsUpdate.calledWith('Cloud_Workspace_AirGapped_Restrictions_Remaining_Days', 0)).to.be.true;
		expect(mocks.notifySetting.calledWith('Cloud_Workspace_AirGapped_Restrictions_Remaining_Days')).to.be.true;
		expect(airgappedRestrictionObj.isWarningPeriod.called).to.be.false;
	});

	it('should update setting and send rocket.cat message when in warning period', async () => {
		airgappedRestrictionObj.emit('remainingDays', { days: 1 });
		airgappedRestrictionObj.isWarningPeriod.returns(true);

		await Promise.all(promises);
		expect(mocks.settingsUpdate.calledWith('Cloud_Workspace_AirGapped_Restrictions_Remaining_Days', 1)).to.be.true;
		expect(mocks.notifySetting.calledWith('Cloud_Workspace_AirGapped_Restrictions_Remaining_Days')).to.be.true;
		expect(airgappedRestrictionObj.isWarningPeriod.called).to.be.true;
		expect(mocks.i18n.calledWith('AirGapped_Restriction_Warning', { lng: 'pt-br' }));
	});

	it('should recompute restriction if license is applied', async () => {
		mocks.findLastToken.returns('token');
		await licenseMock.validateCb();
		expect(mocks.findLastToken.calledOnce).to.be.true;
		expect(airgappedRestrictionObj.computeRestriction.calledWith('token')).to.be.true;
	});

	it('should recompute restriction if license is removed', async () => {
		mocks.findLastToken.returns('token');
		await licenseMock.removeCb();
		expect(mocks.findLastToken.calledOnce).to.be.true;
		expect(airgappedRestrictionObj.computeRestriction.calledWith('token')).to.be.true;
	});
});
