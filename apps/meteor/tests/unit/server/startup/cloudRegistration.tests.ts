import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const models = {
	Settings: {
		getValueById: sinon.stub(),
		updateValueById: sinon.stub(),
	},
};

const { ensureCloudWorkspaceRegistered } = proxyquire.noCallThru().load('../../../../server/startup/cloudRegistration', {
	'@rocket.chat/models': models,
});

describe('ensureCloudWorkspaceRegistered', () => {
	const originalEnv = process.env.OVERWRITE_SETTING_Show_Setup_Wizard;

	const stubSettings = (values: Record<string, string | undefined>) => {
		models.Settings.getValueById.callsFake(async (id: string) => values[id]);
	};

	beforeEach(() => {
		delete process.env.OVERWRITE_SETTING_Show_Setup_Wizard;
		models.Settings.getValueById.reset();
		models.Settings.updateValueById.reset();
	});

	afterEach(() => {
		if (originalEnv === undefined) {
			delete process.env.OVERWRITE_SETTING_Show_Setup_Wizard;
		} else {
			process.env.OVERWRITE_SETTING_Show_Setup_Wizard = originalEnv;
		}
	});

	it('should not touch the setting when OVERWRITE_SETTING_Show_Setup_Wizard is set', async () => {
		process.env.OVERWRITE_SETTING_Show_Setup_Wizard = 'completed';
		stubSettings({ Show_Setup_Wizard: 'completed' });

		await ensureCloudWorkspaceRegistered();

		expect(models.Settings.updateValueById.called).to.be.false;
	});

	it('should not touch the setting when the workspace is already registered', async () => {
		stubSettings({
			Cloud_Workspace_Client_Id: 'client-id',
			Cloud_Workspace_Client_Secret: 'client-secret',
			Show_Setup_Wizard: 'completed',
		});

		await ensureCloudWorkspaceRegistered();

		expect(models.Settings.updateValueById.called).to.be.false;
	});

	it('should not touch the setting when the setup wizard is not completed', async () => {
		stubSettings({ Show_Setup_Wizard: 'in_progress' });

		await ensureCloudWorkspaceRegistered();

		expect(models.Settings.updateValueById.called).to.be.false;
	});

	it('should flip the setup wizard to in_progress when unregistered, completed and no env override', async () => {
		stubSettings({ Show_Setup_Wizard: 'completed' });

		await ensureCloudWorkspaceRegistered();

		expect(models.Settings.updateValueById.calledOnceWith('Show_Setup_Wizard', 'in_progress')).to.be.true;
	});
});
