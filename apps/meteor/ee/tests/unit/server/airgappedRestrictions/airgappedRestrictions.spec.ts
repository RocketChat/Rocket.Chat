import { expect } from 'chai';
import { afterEach, describe, it, vi } from 'vitest';

// The SUT wires event handlers onto `AirGappedRestriction` and license callbacks at module load.
// We build the emitter, license mock and collaborator spies in `vi.hoisted` so the hoisted
// `vi.mock` factories can reference them, then load the SUT (via `await import`) after the mocks.
// sinon and the Emitter base class are require()d inside the hoisted block because the top-level
// imports have not executed at hoist time.
const { airgappedRestrictionObj, licenseMock, mocks, getPromises, resetPromises } = vi.hoisted(() => {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const sinon = require('sinon');
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const { Emitter } = require('@rocket.chat/emitter');

	let promises: Array<Promise<any>> = [];

	class AirgappedRestriction extends Emitter<{ remainingDays: { days: number } }> {
		computeRestriction = sinon.spy();

		isWarningPeriod = sinon.stub();

		override on(type: any, cb: any): any {
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

	return {
		airgappedRestrictionObj,
		licenseMock,
		mocks,
		getPromises: () => promises,
		resetPromises: () => {
			promises = [];
		},
	};
});

vi.mock('@rocket.chat/license', () => ({ AirGappedRestriction: airgappedRestrictionObj, License: licenseMock }));
vi.mock('@rocket.chat/models', () => ({
	Settings: {
		updateValueById: mocks.settingsUpdate,
	},
	Statistics: {
		findLastStatsToken: mocks.findLastToken,
	},
}));
// NOTE: the original proxyquire test left `auditedSettingUpdates` un-mocked and relied on its real
// implementation forwarding to `Settings.updateValueById` (and on `registerModel('IServerEventsModel')`
// so its `ServerEvents.createAuditServerEvent` call worked). Under Vitest that real module pulls an
// `app/settings/server` chain importing Meteor-only modules (`meteor/check`, `meteor/meteor`, …) that
// cannot be resolved. We replace it with a faithful stand-in: `updateAuditedBySystem(actor)(fn, key,
// value)` simply invokes `fn(key, value)` — exactly the asserted behaviour (`Settings.updateValueById`
// called with the key/value). No assertion targets the audit-event side effect, so this is behaviour-
// preserving for every assertion in this suite.
vi.mock('../../../../../server/settings/lib/auditedSettingUpdates', () => ({
	updateAuditedBySystem:
		() =>
		(fn: any, ...args: any[]) =>
			fn(...args),
}));
vi.mock('../../../../../app/lib/server/lib/notifyListener', () => ({ notifyOnSettingChangedById: mocks.notifySetting }));
vi.mock('../../../../../server/lib/i18n', () => ({ i18n: { t: mocks.i18n } }));
vi.mock('../../../../../server/lib/sendMessagesToAdmins', () => ({ sendMessagesToAdmins: mocks.sendMessagesToAdmins }));

await import('../../../../app/license/server/airGappedRestrictions');

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
		resetPromises();
	});
	it('should update setting when restriction is removed', async () => {
		airgappedRestrictionObj.emit('remainingDays', { days: -1 });

		await Promise.all(getPromises());
		expect(mocks.settingsUpdate.calledWith('Cloud_Workspace_AirGapped_Restrictions_Remaining_Days', -1)).to.be.true;
		expect(mocks.notifySetting.calledWith('Cloud_Workspace_AirGapped_Restrictions_Remaining_Days')).to.be.true;
		expect(airgappedRestrictionObj.isWarningPeriod.called).to.be.false;
	});

	it('should update setting when restriction is applied', async () => {
		airgappedRestrictionObj.emit('remainingDays', { days: 0 });

		await Promise.all(getPromises());
		expect(mocks.settingsUpdate.calledWith('Cloud_Workspace_AirGapped_Restrictions_Remaining_Days', 0)).to.be.true;
		expect(mocks.notifySetting.calledWith('Cloud_Workspace_AirGapped_Restrictions_Remaining_Days')).to.be.true;
		expect(airgappedRestrictionObj.isWarningPeriod.called).to.be.false;
	});

	it('should update setting and send rocket.cat message when in warning period', async () => {
		airgappedRestrictionObj.emit('remainingDays', { days: 1 });
		airgappedRestrictionObj.isWarningPeriod.returns(true);

		await Promise.all(getPromises());
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
