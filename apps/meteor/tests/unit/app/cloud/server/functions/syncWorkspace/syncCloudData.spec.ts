import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const models = {
	Settings: { updateValueById: sinon.stub() },
};

const mockedFetchWorkspaceSyncPayload = sinon.stub();

const { syncCloudData } = proxyquire.noCallThru().load('../../../../../../../app/cloud/server/functions/syncWorkspace/syncCloudData.ts', {
	'@rocket.chat/license': { DuplicatedLicenseError: sinon.stub() },
	'@rocket.chat/models': models,
	'../../../../../lib/callbacks': { callbacks: { run: sinon.stub() } },
	'../../../../../lib/errors/CloudWorkspaceAccessError': { CloudWorkspaceAccessError: sinon.stub() },
	'../../../../../lib/errors/CloudWorkspaceRegistrationError': { CloudWorkspaceRegistrationError: sinon.stub() },
	'../../../../../server/lib/logger/system': { SystemLogger: { info: sinon.stub(), error: sinon.stub() } },
	'../buildRegistrationData': { buildWorkspaceRegistrationData: sinon.stub().resolves({}) },
	'../getWorkspaceAccessToken': {
		getWorkspaceAccessToken: sinon.stub().resolves('token'),
		CloudWorkspaceAccessTokenEmptyError: sinon.stub(),
	},
	'../retrieveRegistrationStatus': { retrieveRegistrationStatus: sinon.stub().resolves({ workspaceRegistered: true }) },
	'./fetchWorkspaceSyncPayload': { fetchWorkspaceSyncPayload: mockedFetchWorkspaceSyncPayload },
});

describe('SyncCloudData', () => {
	beforeEach(() => {
		models.Settings.updateValueById.reset();
		mockedFetchWorkspaceSyncPayload.reset();
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

		mockedFetchWorkspaceSyncPayload.resolves(workspaceSyncPayloadResponse);

		await syncCloudData();

		expect(mockedFetchWorkspaceSyncPayload.calledOnce).to.be.true;

		expect(
			models.Settings.updateValueById.calledOnceWith(
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

		mockedFetchWorkspaceSyncPayload.resolves(workspaceSyncPayloadResponse);

		await syncCloudData();

		expect(mockedFetchWorkspaceSyncPayload.calledOnce).to.be.true;

		expect(models.Settings.updateValueById.calledOnce).to.be.true;

		expect(models.Settings.updateValueById.calledWith('Cloud_Sync_Announcement_Payload', 'null')).to.be.true;
	});
});
