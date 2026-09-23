import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import p from 'proxyquire';
import sinon from 'sinon';

const loggerMock = { info: sinon.stub(), warn: sinon.stub(), error: sinon.stub(), debug: sinon.stub() };
const updateValueByIdMock = sinon.stub();
const findOneByIdMock = sinon.stub();
const notifyOnSettingChangedByIdMock = sinon.stub();
const settingsGetMock = sinon.stub();
const hasModuleMock = sinon.stub();

const { applyDiscussionEnforcementOverride, restoreDiscussionEnabled, restoreDiscussionEnabledWithoutLicense } = p
	.noCallThru()
	.load('../../../../../../ee/server/lib/abac/discussionEnforcementOverride.ts', {
		'@rocket.chat/license': { License: { hasModule: hasModuleMock } },
		'@rocket.chat/logger': { Logger: sinon.stub().returns(loggerMock) },
		'@rocket.chat/models': { Settings: { updateValueById: updateValueByIdMock, findOneById: findOneByIdMock } },
		'../../../../server/lib/notifyListener': { notifyOnSettingChangedById: notifyOnSettingChangedByIdMock },
		'../../../../server/settings': { settings: { get: settingsGetMock } },
	}) as {
	applyDiscussionEnforcementOverride: () => Promise<void>;
	restoreDiscussionEnabled: () => Promise<void>;
	restoreDiscussionEnabledWithoutLicense: () => Promise<void>;
};

const valueWrittenTo = (settingId: string): unknown => updateValueByIdMock.getCalls().find((call) => call.args[0] === settingId)?.args[1];

const workspace = ({
	abacEnabled = false,
	enforceAllRooms = false,
	discussionEnabled = true as unknown,
	captured = '',
}: {
	abacEnabled?: boolean;
	enforceAllRooms?: boolean;
	discussionEnabled?: unknown;
	captured?: string;
} = {}) => {
	settingsGetMock.withArgs('ABAC_Enabled').returns(abacEnabled);
	settingsGetMock.withArgs('ABAC_Enforce_All_Rooms').returns(enforceAllRooms);
	settingsGetMock.withArgs('Discussion_enabled').returns(discussionEnabled);
	settingsGetMock.withArgs('ABAC_Discussion_Enabled_Restore').returns(captured);
};

describe('discussionEnforcementOverride (ABAC)', () => {
	beforeEach(() => {
		updateValueByIdMock.reset();
		findOneByIdMock.reset();
		notifyOnSettingChangedByIdMock.reset();
		settingsGetMock.reset();
		hasModuleMock.reset();
		loggerMock.info.reset();
		loggerMock.warn.reset();
		loggerMock.error.reset();

		updateValueByIdMock.resolves({ modifiedCount: 1 });
		findOneByIdMock.resolves(null);
		notifyOnSettingChangedByIdMock.resolves();
		hasModuleMock.returns(false);
	});

	describe('switching enforcement on', () => {
		it('should capture the previous value and hold the setting at false', async () => {
			workspace({ abacEnabled: true, enforceAllRooms: true, discussionEnabled: true });

			await applyDiscussionEnforcementOverride();

			expect(valueWrittenTo('ABAC_Discussion_Enabled_Restore')).to.equal('true');
			expect(valueWrittenTo('Discussion_enabled')).to.be.false;
		});

		it('should capture a workspace that already had discussions off', async () => {
			workspace({ abacEnabled: true, enforceAllRooms: true, discussionEnabled: false });

			await applyDiscussionEnforcementOverride();

			expect(valueWrittenTo('ABAC_Discussion_Enabled_Restore')).to.equal('false');
		});

		it('should not re-capture once an override is in effect, which is what a restart replays', async () => {
			workspace({ abacEnabled: true, enforceAllRooms: true, discussionEnabled: false, captured: 'true' });

			await applyDiscussionEnforcementOverride();

			expect(valueWrittenTo('ABAC_Discussion_Enabled_Restore')).to.be.undefined;
		});

		it('should re-apply the hold on a replay, so a capture taken without its write converges', async () => {
			workspace({ abacEnabled: true, enforceAllRooms: true, discussionEnabled: true, captured: 'true' });

			await applyDiscussionEnforcementOverride();

			expect(valueWrittenTo('ABAC_Discussion_Enabled_Restore')).to.be.undefined;
			expect(valueWrittenTo('Discussion_enabled')).to.be.false;
		});

		it('should not capture a value that is not loaded yet', async () => {
			workspace({ abacEnabled: true, enforceAllRooms: true });
			// set past `workspace`, whose default would swallow an explicitly passed `undefined`
			settingsGetMock.withArgs('Discussion_enabled').returns(undefined);

			await applyDiscussionEnforcementOverride();

			expect(updateValueByIdMock.called).to.be.false;
			expect(loggerMock.warn.calledOnce).to.be.true;
		});

		it('should notify listeners of every value it writes', async () => {
			workspace({ abacEnabled: true, enforceAllRooms: true, discussionEnabled: true });

			await applyDiscussionEnforcementOverride();

			expect(notifyOnSettingChangedByIdMock.calledWith('Discussion_enabled')).to.be.true;
			expect(notifyOnSettingChangedByIdMock.calledWith('ABAC_Discussion_Enabled_Restore')).to.be.true;
		});

		it('should not notify for a write the model reported as a no-op', async () => {
			workspace({ abacEnabled: true, enforceAllRooms: true, discussionEnabled: true });
			updateValueByIdMock.resolves({ modifiedCount: 0 });

			await applyDiscussionEnforcementOverride();

			expect(notifyOnSettingChangedByIdMock.called).to.be.false;
		});
	});

	describe('with only one gate on', () => {
		it('should not override while ABAC itself is off', async () => {
			workspace({ abacEnabled: false, enforceAllRooms: true });

			await applyDiscussionEnforcementOverride();

			expect(updateValueByIdMock.called).to.be.false;
		});

		it('should not override while enforcement is off', async () => {
			workspace({ abacEnabled: true, enforceAllRooms: false });

			await applyDiscussionEnforcementOverride();

			expect(updateValueByIdMock.called).to.be.false;
		});

		it('should restore when ABAC goes off under an override, not only when enforcement does', async () => {
			workspace({ abacEnabled: false, enforceAllRooms: true, captured: 'true' });

			await applyDiscussionEnforcementOverride();

			expect(valueWrittenTo('Discussion_enabled')).to.be.true;
			expect(valueWrittenTo('ABAC_Discussion_Enabled_Restore')).to.equal('');
		});
	});

	describe('restoring', () => {
		it('should put back the value that was captured', async () => {
			workspace({ captured: 'true' });

			await restoreDiscussionEnabled();

			expect(valueWrittenTo('Discussion_enabled')).to.be.true;
		});

		it('should put back a workspace that had discussions off before enforcement', async () => {
			workspace({ captured: 'false' });

			await restoreDiscussionEnabled();

			expect(valueWrittenTo('Discussion_enabled')).to.be.false;
		});

		it('should clear the capture so a later switch-on captures afresh', async () => {
			workspace({ captured: 'true' });

			await restoreDiscussionEnabled();

			expect(valueWrittenTo('ABAC_Discussion_Enabled_Restore')).to.equal('');
		});

		it('should do nothing when no override was ever in effect', async () => {
			workspace({ captured: '' });

			await restoreDiscussionEnabled();

			expect(updateValueByIdMock.called).to.be.false;
		});

		it('should do nothing rather than guess when the capture is unreadable', async () => {
			workspace({ captured: 'yes' });

			await restoreDiscussionEnabled();

			expect(updateValueByIdMock.called).to.be.false;
		});
	});

	describe('booting without the ABAC module', () => {
		it('should put back a capture the licence down hook never got to, reading it past the cache', async () => {
			// The setting is enterprise, so the cache answers with its `invalidValue` here.
			settingsGetMock.withArgs('ABAC_Discussion_Enabled_Restore').returns('');
			findOneByIdMock.withArgs('ABAC_Discussion_Enabled_Restore').resolves({ _id: 'ABAC_Discussion_Enabled_Restore', value: 'true' });

			await restoreDiscussionEnabledWithoutLicense();

			expect(valueWrittenTo('Discussion_enabled')).to.be.true;
			expect(valueWrittenTo('ABAC_Discussion_Enabled_Restore')).to.equal('');
		});

		it('should leave a licensed workspace to its watcher', async () => {
			hasModuleMock.returns(true);
			findOneByIdMock.withArgs('ABAC_Discussion_Enabled_Restore').resolves({ _id: 'ABAC_Discussion_Enabled_Restore', value: 'true' });

			await restoreDiscussionEnabledWithoutLicense();

			expect(findOneByIdMock.called).to.be.false;
			expect(updateValueByIdMock.called).to.be.false;
		});

		it('should do nothing on a workspace that never enforced, where the capture was never written', async () => {
			await restoreDiscussionEnabledWithoutLicense();

			expect(updateValueByIdMock.called).to.be.false;
		});

		it('should swallow a read failure rather than break the rest of the startup', async () => {
			findOneByIdMock.rejects(new Error('mongo is down'));

			await restoreDiscussionEnabledWithoutLicense();

			expect(loggerMock.error.calledOnce).to.be.true;
		});
	});

	it('should never run two fires at once, so neither reads the capture mid-write', async () => {
		workspace({ abacEnabled: true, enforceAllRooms: true, discussionEnabled: true });

		let active = 0;
		let peak = 0;
		updateValueByIdMock.callsFake(async () => {
			active += 1;
			peak = Math.max(peak, active);
			await new Promise((resolve) => {
				setTimeout(resolve, 5);
			});
			active -= 1;
			return { modifiedCount: 1 };
		});

		await Promise.all([applyDiscussionEnforcementOverride(), applyDiscussionEnforcementOverride()]);

		expect(peak).to.equal(1);
	});

	it('should keep serving fires after one of them fails', async () => {
		workspace({ abacEnabled: true, enforceAllRooms: true, discussionEnabled: true });
		updateValueByIdMock.onFirstCall().rejects(new Error('mongo is down'));

		await applyDiscussionEnforcementOverride();
		updateValueByIdMock.reset();
		updateValueByIdMock.resolves({ modifiedCount: 1 });
		await applyDiscussionEnforcementOverride();

		expect(valueWrittenTo('Discussion_enabled')).to.be.false;
	});

	it('should swallow a write failure rather than break the settings watcher', async () => {
		workspace({ abacEnabled: true, enforceAllRooms: true, discussionEnabled: true });
		updateValueByIdMock.rejects(new Error('mongo is down'));

		await applyDiscussionEnforcementOverride();

		expect(loggerMock.error.calledOnce).to.be.true;
	});
});
