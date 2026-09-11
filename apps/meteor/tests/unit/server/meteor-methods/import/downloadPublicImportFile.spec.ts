import { PassThrough } from 'node:stream';

import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const progressStep = {
	DOWNLOADING_FILE: 'importer_downloading_file',
	FILE_LOADED: 'importer_file_loaded',
	ERROR: 'importer_import_failed',
};

const stubs = {
	newOperation: sinon.stub(),
	serverFetch: sinon.stub(),
	importersGet: sinon.stub(),
	createWriteStream: sinon.stub(),
	startFileUpload: sinon.stub(),
	updateProgress: sinon.stub(),
	updateRecord: sinon.stub(),
	systemLoggerError: sinon.stub(),
};

class MockImporter {
	startFileUpload = stubs.startFileUpload;

	updateProgress = stubs.updateProgress;

	updateRecord = stubs.updateRecord;
}

const { executeDownloadPublicImportFile } = proxyquire
	.noCallThru()
	.load('../../../../../server/meteor-methods/import/downloadPublicImportFile.ts', {
		'@rocket.chat/core-services': { Import: { newOperation: stubs.newOperation } },
		'@rocket.chat/server-fetch': { serverFetch: stubs.serverFetch },
		'meteor/meteor': { Meteor: { methods: sinon.stub() } },
		'../../lib/authorization/hasPermission': { hasPermissionAsync: sinon.stub() },
		'../../lib/deprecationWarningLogger': { methodDeprecationLogger: { method: sinon.stub() } },
		'../../lib/import': { Importers: { get: stubs.importersGet } },
		'../../lib/import/startup/store': { RocketChatImportFileInstance: { createWriteStream: stubs.createWriteStream } },
		'../../lib/logger/system': { SystemLogger: { error: stubs.systemLoggerError } },
		'../../settings': { settings: { get: sinon.stub().returns('') } },
		'../../../app/importer/lib/ImporterProgressStep': { ProgressStep: progressStep },
	});

describe('executeDownloadPublicImportFile', () => {
	let writeStream: PassThrough;

	beforeEach(() => {
		Object.values(stubs).forEach((stub) => stub.reset());

		writeStream = new PassThrough();
		stubs.newOperation.resolves({ _id: 'operation-id' });
		stubs.importersGet.returns({ key: 'csv', name: 'CSV', importer: MockImporter });
		stubs.createWriteStream.returns(writeStream);
		stubs.startFileUpload.resolves();
		stubs.updateProgress.resolves();
		stubs.updateRecord.resolves();
	});

	it('rejects an unsuccessful HTTP response and drains its body', async () => {
		const responseBody = new PassThrough();
		const resume = sinon.spy(responseBody, 'resume');
		stubs.serverFetch.resolves({ ok: false, status: 404, body: responseBody });

		await expect(executeDownloadPublicImportFile('user-id', 'https://example.com/import.zip', 'csv')).to.be.rejectedWith(
			'Unexpected response status 404',
		);

		expect(resume.calledOnce).to.be.true;
		expect(writeStream.destroyed).to.be.true;
		expect(stubs.updateProgress.calledWith(progressStep.ERROR)).to.be.true;
	});

	it('marks the import as failed and destroys the writable when the HTTP stream fails', async () => {
		const responseBody = new PassThrough();
		stubs.serverFetch.resolves({ ok: true, status: 200, body: responseBody });

		await executeDownloadPublicImportFile('user-id', 'https://example.com/import.zip', 'csv');
		const writeStreamClosed = new Promise<void>((resolve) => writeStream.once('close', resolve));
		responseBody.destroy(new Error('stream failed'));
		await writeStreamClosed;

		expect(writeStream.destroyed).to.be.true;
		expect(stubs.updateProgress.withArgs(progressStep.ERROR).calledOnce).to.be.true;
		expect(stubs.updateProgress.calledWith(progressStep.FILE_LOADED)).to.be.false;
	});

	it('marks the import as failed and destroys the HTTP stream when the writable fails', async () => {
		const responseBody = new PassThrough();
		stubs.serverFetch.resolves({ ok: true, status: 200, body: responseBody });

		await executeDownloadPublicImportFile('user-id', 'https://example.com/import.zip', 'csv');
		const responseBodyClosed = new Promise<void>((resolve) => responseBody.once('close', resolve));
		writeStream.destroy(new Error('stream failed'));
		await responseBodyClosed;

		expect(responseBody.destroyed).to.be.true;
		expect(stubs.updateProgress.withArgs(progressStep.ERROR).calledOnce).to.be.true;
		expect(stubs.updateProgress.calledWith(progressStep.FILE_LOADED)).to.be.false;
	});

	it('handles a rejected error progress update when the writable fails', async () => {
		const responseBody = new PassThrough();
		const unhandledRejection = sinon.spy();
		const progressUpdateError = new Error('progress update failed');
		stubs.serverFetch.resolves({ ok: true, status: 200, body: responseBody });
		stubs.updateProgress.withArgs(progressStep.ERROR).rejects(progressUpdateError);
		process.on('unhandledRejection', unhandledRejection);

		try {
			await executeDownloadPublicImportFile('user-id', 'https://example.com/import.zip', 'csv');
			const responseBodyClosed = new Promise<void>((resolve) => responseBody.once('close', resolve));
			writeStream.destroy(new Error('stream failed'));
			await responseBodyClosed;
			await new Promise<void>((resolve) => setImmediate(resolve));

			expect(unhandledRejection.called).to.be.false;
			expect(stubs.updateProgress.withArgs(progressStep.ERROR).calledOnce).to.be.true;
			sinon.assert.calledOnceWithExactly(stubs.systemLoggerError, {
				msg: 'Failed to update import progress to ERROR',
				err: progressUpdateError,
			});
		} finally {
			process.off('unhandledRejection', unhandledRejection);
		}
	});

	it('marks the file as loaded when the writable finishes', async () => {
		const responseBody = new PassThrough();
		stubs.serverFetch.resolves({ ok: true, status: 200, body: responseBody });

		await executeDownloadPublicImportFile('user-id', 'https://example.com/import.zip', 'csv');
		expect(stubs.updateProgress.calledWith(progressStep.FILE_LOADED)).to.be.false;

		const finished = new Promise<void>((resolve) => writeStream.once('finish', resolve));
		responseBody.end('file contents');
		await finished;

		expect(stubs.updateProgress.calledWith(progressStep.FILE_LOADED)).to.be.true;
	});
});
