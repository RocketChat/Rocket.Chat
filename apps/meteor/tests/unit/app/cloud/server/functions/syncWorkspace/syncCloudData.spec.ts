import { expect } from 'chai';
import { describe, it, beforeEach, vi } from 'vitest';

const { stubs, sandbox } = vi.hoisted(() => {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const sinon = require('sinon');
	const sandbox = sinon.createSandbox();
	return {
		sandbox,
		stubs: {
			Settings: { updateValueById: sandbox.stub() },
			fetchWorkspaceSyncPayload: sandbox.stub(),
			DuplicatedLicenseError: sandbox.stub(),
			callbacks: { run: sandbox.stub() },
			CloudWorkspaceAccessError: sandbox.stub(),
			CloudWorkspaceRegistrationError: sandbox.stub(),
			SystemLogger: { info: sandbox.stub(), error: sandbox.stub() },
			buildWorkspaceRegistrationData: sandbox.stub().resolves({}),
			getWorkspaceAccessToken: sandbox.stub().resolves('token'),
			CloudWorkspaceAccessTokenEmptyError: sandbox.stub(),
			retrieveRegistrationStatus: sandbox.stub().resolves({ workspaceRegistered: true }),
		},
	};
});

vi.mock('@rocket.chat/license', () => ({ DuplicatedLicenseError: stubs.DuplicatedLicenseError }));
vi.mock('@rocket.chat/models', () => ({ Settings: stubs.Settings }));
vi.mock('../../../../../../../server/lib/callbacks', () => ({ callbacks: stubs.callbacks }));
vi.mock('../../../../../../../lib/errors/CloudWorkspaceAccessError', () => ({ CloudWorkspaceAccessError: stubs.CloudWorkspaceAccessError }));
vi.mock('../../../../../../../lib/errors/CloudWorkspaceRegistrationError', () => ({
	CloudWorkspaceRegistrationError: stubs.CloudWorkspaceRegistrationError,
}));
vi.mock('../../../../../../../server/lib/logger/system', () => ({ SystemLogger: stubs.SystemLogger }));
vi.mock('../../../../../../../app/cloud/server/functions/buildRegistrationData', () => ({
	buildWorkspaceRegistrationData: stubs.buildWorkspaceRegistrationData,
}));
vi.mock('../../../../../../../app/cloud/server/functions/getWorkspaceAccessToken', () => ({
	getWorkspaceAccessToken: stubs.getWorkspaceAccessToken,
	CloudWorkspaceAccessTokenEmptyError: stubs.CloudWorkspaceAccessTokenEmptyError,
}));
vi.mock('../../../../../../../app/cloud/server/functions/retrieveRegistrationStatus', () => ({
	retrieveRegistrationStatus: stubs.retrieveRegistrationStatus,
}));
vi.mock('../../../../../../../app/cloud/server/functions/syncWorkspace/fetchWorkspaceSyncPayload', () => ({
	fetchWorkspaceSyncPayload: stubs.fetchWorkspaceSyncPayload,
}));

const { syncCloudData } = await import('../../../../../../../app/cloud/server/functions/syncWorkspace/syncCloudData');

describe('SyncCloudData', () => {
	beforeEach(() => {
		sandbox.reset();
		stubs.buildWorkspaceRegistrationData.resolves({});
		stubs.getWorkspaceAccessToken.resolves('token');
		stubs.retrieveRegistrationStatus.resolves({ workspaceRegistered: true });
	});

	it('should save cloudSyncAnnouncement payload on Cloud_Sync_Announcement_Payload setting when present', async () => {
		const workspaceSyncPayloadResponse = {
			workspaceId: 'workspaceId',
			publicKey: 'publicKey',
			license: {},
			removeLicense: false,
			cloudSyncAnnouncement: {
				viewId: 'subscription-announcement',
				appId: 'cloud-announcements-core',
				blocks: [
					{
						type: 'callout',
						title: {
							type: 'plain_text',
							text: 'Workspace eligible for Starter Plan',
						},
						text: {
							type: 'plain_text',
							text: 'Get free access to premium capabilities for up to 50 users',
						},
						accessory: {
							type: 'button',
							text: {
								type: 'plain_text',
								text: 'Switch Plan',
							},
							actionId: 'callout-action',
							appId: 'cloud-announcements-core',
							blockId: 'section-button',
						},
					},
				],
			},
		};

		stubs.fetchWorkspaceSyncPayload.resolves(workspaceSyncPayloadResponse);

		await syncCloudData();

		expect(stubs.fetchWorkspaceSyncPayload.calledOnce).to.be.true;

		expect(
			stubs.Settings.updateValueById.calledOnceWith(
				'Cloud_Sync_Announcement_Payload',
				JSON.stringify(workspaceSyncPayloadResponse.cloudSyncAnnouncement),
			),
		).to.be.true;
	});

	it("Should save as 'null' the setting update if cloudSyncAnnouncement is not present", async () => {
		const workspaceSyncPayloadResponse = {
			workspaceId: 'workspaceId',
			publicKey: 'publicKey',
			license: {},
			removeLicense: false,
		};

		stubs.fetchWorkspaceSyncPayload.resolves(workspaceSyncPayloadResponse);

		await syncCloudData();

		expect(stubs.fetchWorkspaceSyncPayload.calledOnce).to.be.true;

		expect(stubs.Settings.updateValueById.calledOnce).to.be.true;

		expect(stubs.Settings.updateValueById.calledWith('Cloud_Sync_Announcement_Payload', 'null')).to.be.true;
	});
});
