import path from 'node:path';

import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const importStorePath = '/tmp/rocketchat-importer';

const progressStep = {
	DOWNLOADING_FILE: 'importer_downloading_file',
	PREPARING_CHANNELS: 'importer_preparing_channels',
	PREPARING_MESSAGES: 'importer_preparing_messages',
	PREPARING_USERS: 'importer_preparing_users',
	PREPARING_CONTACTS: 'importer_preparing_contacts',
	PREPARING_STARTED: 'importer_preparing_started',
	USER_SELECTION: 'importer_user_selection',
	DONE: 'importer_done',
	CANCELLED: 'importer_import_cancelled',
	ERROR: 'importer_import_failed',
	FILE_LOADED: 'importer_file_loaded',
};

const stubs = {
	findLastImport: sinon.stub(),
	prepareUsingLocalFile: sinon.stub(),
	buildSelection: sinon.stub(),
};

let importRecord: { file?: string };

class MockImporter {
	progress = { step: progressStep.FILE_LOADED };

	importRecord = importRecord;

	prepareUsingLocalFile = stubs.prepareUsingLocalFile;

	buildSelection = stubs.buildSelection;
}

class MeteorError extends Error {
	constructor(public error: string) {
		super(error);
	}
}

const { executeGetImportFileData } = proxyquire.noCallThru().load('../../../../../server/meteor-methods/import/getImportFileData.ts', {
	'@rocket.chat/models': { Imports: { findLastImport: stubs.findLastImport } },
	'meteor/meteor': { Meteor: { methods: sinon.stub(), Error: MeteorError } },
	'../../lib/authorization/hasPermission': { hasPermissionAsync: sinon.stub() },
	'../../lib/deprecationWarningLogger': { methodDeprecationLogger: { method: sinon.stub() } },
	'../../lib/import': { Importers: { get: () => ({ key: 'csv', name: 'CSV', importer: MockImporter }) } },
	'../../lib/import/startup/store': { RocketChatImportFileInstance: { absolutePath: importStorePath } },
	'../../../app/importer/lib/ImporterProgressStep': { ProgressStep: progressStep },
});

describe('executeGetImportFileData', () => {
	beforeEach(() => {
		Object.values(stubs).forEach((stub) => stub.reset());
		stubs.findLastImport.resolves({ _id: 'operation-id', importerKey: 'csv' });
		stubs.prepareUsingLocalFile.resolves();
		stubs.buildSelection.resolves({});
	});

	it('reads the import file from the import store', async () => {
		importRecord = { file: '2026010_user-id_import.zip' };

		await executeGetImportFileData();

		sinon.assert.calledOnceWithExactly(stubs.prepareUsingLocalFile, path.join(importStorePath, '2026010_user-id_import.zip'));
	});

	['2026010_user-id_../../../etc/passwd', '/etc/passwd', '..'].forEach((file) => {
		it(`refuses to read ${file} outside the import store`, async () => {
			importRecord = { file };

			await expect(executeGetImportFileData()).to.be.rejectedWith('error-invalid-file-name');

			expect(stubs.prepareUsingLocalFile.called).to.be.false;
		});
	});
});
