import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const models = {
	Settings: {
		getValueById: sinon.stub(),
		findOneById: sinon.stub(),
		updateValueById: sinon.stub(),
	},
};

const { ensureCloudWorkspaceRegistered } = proxyquire.noCallThru().load('../../../../server/startup/cloudRegistration', {
	'@rocket.chat/models': models,
});

describe('ensureCloudWorkspaceRegistered', () => {
	const stubSettings = (values: Record<string, string | undefined>, showSetupWizard: Record<string, unknown> | null) => {
		models.Settings.getValueById.callsFake(async (id: string) => values[id]);
		models.Settings.findOneById.resolves(showSetupWizard);
	};

	beforeEach(() => {
		models.Settings.getValueById.reset();
		models.Settings.findOneById.reset();
		models.Settings.updateValueById.reset();
	});

	it('should not touch the setting when its value was pinned via env override and is unchanged', async () => {
		stubSettings({}, { value: 'completed', valueSource: 'processEnvValue', processEnvValue: 'completed' });

		await ensureCloudWorkspaceRegistered();

		expect(models.Settings.updateValueById.called).to.be.false;
	});

	it('should flip the setting when the value diverged from the env override', async () => {
		stubSettings({}, { value: 'completed', valueSource: 'processEnvValue', processEnvValue: 'pending' });

		await ensureCloudWorkspaceRegistered();

		expect(models.Settings.updateValueById.calledOnceWith('Show_Setup_Wizard', 'in_progress')).to.be.true;
	});

	it('should not touch the setting when the workspace is already registered', async () => {
		stubSettings(
			{
				Cloud_Workspace_Client_Id: 'client-id',
				Cloud_Workspace_Client_Secret: 'client-secret',
			},
			{ value: 'completed', valueSource: 'packageValue' },
		);

		await ensureCloudWorkspaceRegistered();

		expect(models.Settings.updateValueById.called).to.be.false;
	});

	it('should not touch the setting when the setup wizard is not completed', async () => {
		stubSettings({}, { value: 'in_progress', valueSource: 'packageValue' });

		await ensureCloudWorkspaceRegistered();

		expect(models.Settings.updateValueById.called).to.be.false;
	});

	it('should flip the setup wizard to in_progress when unregistered, completed and not env-pinned', async () => {
		stubSettings({}, { value: 'completed', valueSource: 'packageValue' });

		await ensureCloudWorkspaceRegistered();

		expect(models.Settings.updateValueById.calledOnceWith('Show_Setup_Wizard', 'in_progress')).to.be.true;
	});
});
