import { PassThrough } from 'node:stream';
import { before, beforeEach, describe, it, mock } from 'node:test';

import { expect } from 'chai';
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

let executeDownloadPublicImportFile: any;

before(async () => {
	const moduleMocks = [
		mock.module('@rocket.chat/core-services', { exports: { Import: { newOperation: stubs.newOperation } } }),
		mock.module('@rocket.chat/server-fetch', { exports: { serverFetch: stubs.serverFetch } }),
		mock.module('../../lib/import', { exports: { Importers: { get: stubs.importersGet } } }),
		mock.module('../../lib/import/startup/store', {
			exports: { RocketChatImportFileInstance: { createWriteStream: stubs.createWriteStream } },
		}),
		mock.module('../../lib/logger/system', { exports: { SystemLogger: { error: stubs.systemLoggerError } } }),
		mock.module('../../settings', { exports: { settings: { get: sinon.stub().returns('') } } }),
		mock.module('../../../lib/importer/ImporterProgressStep', { exports: { ProgressStep: progressStep } }),
	];
	({ executeDownloadPublicImportFile } = await import('./downloadPublicImportFile'));
	moduleMocks.forEach((moduleMock) => moduleMock.restore());
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

	it('rejects an unsuccessful HTTP response and destroys its body', async () => {
		const responseBody = new PassThrough();
		stubs.serverFetch.resolves({ ok: false, status: 404, body: responseBody });

		await expect(executeDownloadPublicImportFile('user-id', 'https://example.com/import.zip', 'csv')).to.be.rejectedWith(
			'Unexpected response status 404',
		);

		expect(responseBody.destroyed).to.be.true;
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
