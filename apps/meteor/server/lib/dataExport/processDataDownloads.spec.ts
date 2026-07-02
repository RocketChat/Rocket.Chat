import fs from 'node:fs';

import type { IExportOperation } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { beforeEach, describe, it, vi } from 'vitest';

// The shared `@rocket.chat/models` mock closes over a mutable `exportOperation`. Because vi.mock factories
// are hoisted above module code, the mutable state lives in a `vi.hoisted` holder (`state.exportOperation`)
// that both the mock and the test body read/write — replacing the original module-level `let`.
const { state, modelsMock } = vi.hoisted(() => {
	const state: { exportOperation: any } = { exportOperation: null };

	const modelsMock = {
		ExportOperations: {
			findLastOperationByUser: async (userId: string, fullExport = false) => {
				if (state.exportOperation?.userId === userId && state.exportOperation?.fullExport === fullExport) {
					return state.exportOperation;
				}
			},
			countAllPendingBeforeMyRequest: async (requestDay: Date) => {
				if (
					state.exportOperation &&
					state.exportOperation.createdAt < requestDay &&
					state.exportOperation.status !== 'completed' &&
					state.exportOperation.status !== 'skipped'
				) {
					return 1;
				}
				return 0;
			},
			create: async (data: any) => {
				state.exportOperation = {
					userNameTable: null, // need to keep this null for testing purposes
					...data,
					_id: 'exportOp1',
					createdAt: new Date(),
				};
				return state.exportOperation?._id as IExportOperation['_id'];
			},
			updateOperation: async (data: IExportOperation) => {
				if (state.exportOperation && state.exportOperation._id === data._id) {
					state.exportOperation = { ...state.exportOperation, ...data };
				}
				return { modifiedCount: 1 };
			},

			findOnePending: async () => {
				if (state.exportOperation && state.exportOperation.status !== 'completed' && state.exportOperation.status !== 'skipped') {
					return state.exportOperation;
				}
				return null;
			},
		},
		UserDataFiles: {
			findOneById: async (fileId: string) => {
				if (state.exportOperation?.fileId === fileId) {
					return { _id: fileId };
				}
			},
			findLastFileByUser: async (userId: string) => {
				if (state.exportOperation?.userId === userId && state.exportOperation.fileId) {
					return { _id: state.exportOperation.fileId };
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
				return [{ rid: 'general' }];
			},
		},
		Messages: {
			findPaginated: (_query: object, _options: object) => {
				return {
					cursor: {
						toArray: async () => [
							{ _id: 'msg1', rid: 'general', ts: new Date(), msg: 'Hello World', u: { _id: 'user1', username: 'userone' } },
							{ _id: 'msg2', rid: 'general', ts: new Date(), msg: 'Second message', u: { _id: 'user2', username: 'usertwo' } },
						],
					},
					totalCount: Promise.resolve(0),
				};
			},
		},
	};

	return { state, modelsMock };
});

vi.mock('@rocket.chat/models', () => modelsMock);
// `../../../app/settings/server` (spec-relative) is the same absolute module both dataExport and
// server/methods import — one mock covers every importer.
vi.mock('../../../app/settings/server', () => ({ settings: { get: (_key: string) => undefined } }));
vi.mock('../i18n', () => ({ i18n: { t: (key: string) => key } }));
// requestDataDownload imports `* as dataExport from '../lib/dataExport'` (the barrel index of this dir).
vi.mock('./index', () => ({ getPath: (fileId: string) => `/data-download/${fileId}` }));
vi.mock('meteor/meteor', () => ({ Meteor: { methods: () => undefined } }));
vi.mock('../../../app/file-upload/server', () => ({
	FileUpload: { copy: async (fileId: string, _options: any) => `copied-${fileId}` },
}));
vi.mock('../../../app/utils/server/getURL', () => ({ getURL: (path: string) => `https://example.com${path}` }));
vi.mock('./copyFileUpload', () => ({ copyFileUpload: () => Promise.resolve() }));
vi.mock('./getRoomData', () => ({
	getRoomData: async () => ({
		roomId: 'GENERAL',
		roomName: 'general',
		type: 'c',
		exportedCount: 0,
		status: 'pending',
		userId: 'user1',
		targetFile: 'general.json',
	}),
}));
vi.mock('./sendEmail', () => ({ sendEmail: async () => undefined }));
vi.mock('./uploadZipFile', () => ({ uploadZipFile: async () => ({ _id: 'file1' }) }));

// exportRoomMessagesToFile is left unmocked: it runs for real against the mocked models/settings/i18n,
// exactly as the original (which loaded the real module and injected it).

const { requestDataDownload } = (await import('../../methods/requestDataDownload')) as {
	requestDataDownload: (args: { userData: { _id: string }; fullExport?: boolean }) => Promise<{
		requested: boolean;
		exportOperation: IExportOperation;
		url: string | null;
		pendingOperationsBeforeMyRequest: number;
	}>;
};
const { processDataDownloads } = (await import('./processDataDownloads')) as { processDataDownloads: () => Promise<void> };

const userData = { _id: 'user1', username: 'userone' };

describe('requestDataDownload', () => {
	beforeEach(() => {
		state.exportOperation = null;
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
		state.exportOperation = null;
	});
	it('should process data download for pending export operations', async () => {
		await requestDataDownload({ userData, fullExport: true });

		expect(state.exportOperation).to.not.be.null;
		expect(state.exportOperation?.userId).to.equal('user1');
		expect(state.exportOperation?.fullExport).to.be.true;
		expect(state.exportOperation?.status).to.equal('pending');

		await processDataDownloads();

		expect(state.exportOperation?.status).to.equal('completed');
		expect(state.exportOperation?.fileId).to.equal('file1');
		expect(state.exportOperation?.generatedUserFile).to.be.true;
		expect(state.exportOperation?.roomList).to.have.lengthOf(1);
		expect(state.exportOperation?.roomList?.[0].roomId).to.equal('GENERAL');
		expect(state.exportOperation?.roomList?.[0].exportedCount).to.equal(2);
		expect(state.exportOperation?.exportPath).to.be.string;

		expect(fs.readFileSync(`${state.exportOperation?.exportPath}/${state.exportOperation?.roomList?.[0].targetFile}`, 'utf-8')).to.contain(
			'Hello World',
		);
		expect(state.exportOperation?.generatedFile).to.be.string;
		expect(fs.existsSync(state.exportOperation?.generatedFile as string)).to.be.true;
	});
});
