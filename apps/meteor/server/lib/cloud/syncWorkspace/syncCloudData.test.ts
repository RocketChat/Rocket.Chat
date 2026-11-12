import { before, beforeEach, describe, it, mock } from 'node:test';

import { mockModel } from '@rocket.chat/models/testing';
import { expect } from 'chai';
import sinon from 'sinon';

const models = {
	Settings: { updateValueById: sinon.stub() },
};

const mockedFetchWorkspaceSyncPayload = sinon.stub();

let syncCloudData: typeof import('./syncCloudData').syncCloudData;

before(async () => {
	const moduleMocks = [
		mock.module('@rocket.chat/license', { exports: { DuplicatedLicenseError: sinon.stub() } }),
		mock.module('../../callbacks', { exports: { callbacks: { run: sinon.stub() } } }),
		mock.module('../../../../lib/errors/CloudWorkspaceAccessError', { exports: { CloudWorkspaceAccessError: sinon.stub() } }),
		mock.module('../../../../lib/errors/CloudWorkspaceRegistrationError', { exports: { CloudWorkspaceRegistrationError: sinon.stub() } }),
		mock.module('../../logger/system', { exports: { SystemLogger: { info: sinon.stub(), error: sinon.stub() } } }),
		mock.module('../buildRegistrationData', { exports: { buildWorkspaceRegistrationData: sinon.stub().resolves({}) } }),
		mock.module('../getWorkspaceAccessToken', {
			exports: {
				getWorkspaceAccessToken: sinon.stub().resolves('token'),
				CloudWorkspaceAccessTokenEmptyError: sinon.stub(),
			},
		}),
		mock.module('../retrieveRegistrationStatus', {
			exports: { retrieveRegistrationStatus: sinon.stub().resolves({ workspaceRegistered: true }) },
		}),
		mock.module('./fetchWorkspaceSyncPayload', { exports: { fetchWorkspaceSyncPayload: mockedFetchWorkspaceSyncPayload } }),
	];
	({ syncCloudData } = await import('./syncCloudData'));
	moduleMocks.forEach((moduleMock) => moduleMock.restore());
});

describe('SyncCloudData', () => {
	before(() => {
		mockModel('Settings', models.Settings);
	});

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
