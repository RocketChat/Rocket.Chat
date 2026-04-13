import fs from 'fs';

import type { IExportOperation } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import Sinon from 'sinon';

let exportOperation: IExportOperation | null = null;

const modelsMock = {
	ExportOperations: {
		findLastOperationByUser: async (userId: string, fullExport = false) => {
			if (exportOperation?.userId === userId && exportOperation?.fullExport === fullExport) {
				return exportOperation;
			}
		},
		countAllPendingBeforeMyRequest: async (requestDay: Date) => {
			if (
				exportOperation &&
				exportOperation.createdAt < requestDay &&
				exportOperation.status !== 'completed' &&
				exportOperation.status !== 'skipped'
			) {
				return 1;
			}
			return 0;
		},
		create: async (data: any) => {
			exportOperation = {
				userNameTable: null, // need to keep this null for testing purposes
				...data,
				_id: 'exportOp1',
				createdAt: new Date(),
			};
			return exportOperation?._id as IExportOperation['_id'];
		},
		updateOperation: async (data: IExportOperation) => {
			if (exportOperation && exportOperation._id === data._id) {
				exportOperation = { ...exportOperation, ...data };
			}
			return { modifiedCount: 1 };
		},

		findOnePending: async () => {
			if (exportOperation && exportOperation.status !== 'completed' && exportOperation.status !== 'skipped') {
				return exportOperation;
			}
			return null;
		},
	},
	UserDataFiles: {
		findOneById: async (fileId: string) => {
			if (exportOperation?.fileId === fileId) {
				return {
					_id: fileId,
				};
			}
		},
		findLastFileByUser: async (userId: string) => {
			if (exportOperation?.userId === userId && exportOperation.fileId) {
				return {
					_id: exportOperation.fileId,
				};
			}
		},
	},
	Avatars: {
		findOneByName: async (_name: string) => {
			return null;
		},
	},
	Subscriptions: {
		findByUserId: (_userId: string) => {
			return [
				{
					rid: 'general',
				},
			];
		},
	},
	Messages: {
		findPaginated: (_query: object, _options: object) => {
			return {
				cursor: {
					toArray: async () => [
						{
							_id: 'msg1',
							rid: 'general',
							ts: new Date(),
							msg: 'Hello World',
							u: { _id: 'user1', username: 'userone' },
						},
						{
							_id: 'msg2',
							rid: 'general',
							ts: new Date(),
							msg: 'Second message',
							u: { _id: 'user2', username: 'usertwo' },
						},
					],
				},
				totalCount: Promise.resolve(0),
			};
		},
	},
};

const { exportRoomMessagesToFile } = proxyquire.noCallThru().load('./exportRoomMessagesToFile.ts', {
	'@rocket.chat/models': modelsMock,
	'../../../app/settings/server': {
		settings: {
			get: (_key: string) => {
				return undefined;
			},
		},
	},
	'../i18n': {
		i18n: {
			t: (key: string) => key,
		},
	},
});

const { requestDataDownload } = proxyquire.noCallThru().load('../../methods/requestDataDownload.ts', {
	'@rocket.chat/models': modelsMock,
	'../../app/settings/server': {
		settings: {
			get: (_key: string) => {
				return undefined;
			},
		},
	},
	'../lib/dataExport': {
		getPath: (fileId: string) => `/data-download/${fileId}`,
	},
	'meteor/meteor': {
		Meteor: {
			methods: Sinon.stub(),
		},
	},
}) as {
	requestDataDownload: (args: { userData: { _id: string }; fullExport?: boolean }) => Promise<{
		requested: boolean;
		exportOperation: IExportOperation;
		url: string | null;
		pendingOperationsBeforeMyRequest: number;
	}>;
};

const { processDataDownloads } = proxyquire.noCallThru().load('./processDataDownloads.ts', {
	'@rocket.chat/models': modelsMock,
	'../../../app/file-upload/server': {
		FileUpload: {
			copy: async (fileId: string, _options: any) => {
				return `copied-${fileId}`;
			},
		},
	},
	'../../../app/settings/server': {
		settings: {
			get: (_key: string) => {
				return undefined;
			},
		},
	},
	'../../../app/utils/server/getURL': {
		getURL: (path: string) => `https://example.com${path}`,
	},
	'../i18n': {
		i18n: {
			t: (key: string) => key,
		},
	},
	'./copyFileUpload': {
		copyFileUpload: (_attachmentData: { _id: string; name: string }, _assetsPath: string) => {
			return Promise.resolve();
		},
	},
	'./exportRoomMessagesToFile': {
		exportRoomMessagesToFile,
	},
	'./getRoomData': {
		getRoomData: Sinon.stub().resolves({
			roomId: 'GENERAL',
			roomName: 'general',
			type: 'c',
			exportedCount: 0,
			status: 'pending',
			userId: 'user1',
			targetFile: 'general.json',
		}),
	},
	'./sendEmail': {
		sendEmail: Sinon.stub().resolves(),
	},
	'./uploadZipFile': {
		uploadZipFile: Sinon.stub().resolves({ _id: 'file1' }),
	},
}) as {
	processDataDownloads: () => Promise<void>;
};

const userData = { _id: 'user1', username: 'userone' };

describe('requestDataDownload', () => {
	beforeEach(() => {
		exportOperation = null;
	});

	it('should create a new export operation if none exists', async () => {
		const result = await requestDataDownload({ userData, fullExport: false });

		expect(result.requested).to.be.true;
		expect(result.exportOperation).to.exist;
		expect(result.exportOperation.userId).to.equal('user1');
		expect(result.exportOperation.fullExport).to.be.false;
		expect(result.url).to.be.null;
		expect(result.pendingOperationsBeforeMyRequest).to.equal(0);
		expect(result.exportOperation.status).to.equal('pending');
	});
});

describe('export user data', async () => {
	beforeEach(() => {
		exportOperation = null;
	});
	it('should process data download for pending export operations', async () => {
		await requestDataDownload({ userData, fullExport: true });

		expect(exportOperation).to.not.be.null;
		expect(exportOperation?.userId).to.equal('user1');
		expect(exportOperation?.fullExport).to.be.true;
		expect(exportOperation?.status).to.equal('pending');

		await processDataDownloads();

		expect(exportOperation?.status).to.equal('completed');
		expect(exportOperation?.fileId).to.equal('file1');
		expect(exportOperation?.generatedUserFile).to.be.true;
		expect(exportOperation?.roomList).to.have.lengthOf(1);
		expect(exportOperation?.roomList?.[0].roomId).to.equal('GENERAL');
		expect(exportOperation?.roomList?.[0].exportedCount).to.equal(2);
		expect(exportOperation?.exportPath).to.be.string;

		expect(fs.readFileSync(`${exportOperation?.exportPath}/${exportOperation?.roomList?.[0].targetFile}`, 'utf-8')).to.contain(
			'Hello World',
		);
		expect(exportOperation?.generatedFile).to.be.string;
		expect(fs.existsSync(exportOperation?.generatedFile as string)).to.be.true;
	});
});
