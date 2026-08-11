import { once } from 'node:events';
import { PassThrough } from 'node:stream';

import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const fetch = sinon.stub();
const createWriteStream = sinon.stub();
const startFileUpload = sinon.stub();
const updateProgress = sinon.stub();

class ImporterMock {
	startFileUpload = startFileUpload;

	updateProgress = updateProgress;
}

const { executeDownloadPublicImportFile } = proxyquire
	.noCallThru()
	.load('../../../../../server/meteor-methods/import/downloadPublicImportFile', {
		'@rocket.chat/core-services': {
			Import: { newOperation: sinon.stub().resolves({ _id: 'operation-id' }) },
		},
		'@rocket.chat/server-fetch': { serverFetch: fetch },
		'meteor/meteor': { Meteor: { Error, methods: sinon.stub() } },
		'../../../app/importer/lib/ImporterProgressStep': {
			ProgressStep: {
				DOWNLOADING_FILE: 'importer_downloading_file',
				ERROR: 'importer_import_failed',
				FILE_LOADED: 'importer_file_loaded',
			},
		},
		'../../lib/authorization/hasPermission': { hasPermissionAsync: sinon.stub() },
		'../../lib/deprecationWarningLogger': {
			methodDeprecationLogger: { method: sinon.stub() },
		},
		'../../lib/import': {
			Importers: {
				get: sinon.stub().returns({ key: 'csv', name: 'CSV', importer: ImporterMock }),
			},
		},
		'../../lib/import/startup/store': {
			RocketChatImportFileInstance: { createWriteStream },
		},
		'../../settings': {
			settings: { get: sinon.stub().withArgs('SSRF_Allowlist').returns('internal.example:8080') },
		},
	});

describe('executeDownloadPublicImportFile', () => {
	beforeEach(() => {
		sinon.resetHistory();
		fetch.resetBehavior();
		createWriteStream.resetBehavior();
		startFileUpload.resetBehavior();
		updateProgress.resetBehavior();
		startFileUpload.resolves();
		updateProgress.resolves();
	});

	it('pipes an allowed HTTP response into the import file store using the configured SSRF allowlist', async () => {
		const responseBody = new PassThrough();
		const writeStream = new PassThrough();
		const chunks: Buffer[] = [];
		writeStream.on('data', (chunk: Buffer) => chunks.push(chunk));
		const finished = once(writeStream, 'finish');
		const pipe = sinon.spy(responseBody, 'pipe');
		fetch.resolves({ body: responseBody });
		createWriteStream.returns(writeStream);

		await executeDownloadPublicImportFile('user-id', 'http://internal.example:8080/import.zip', 'csv');

		sinon.assert.calledOnceWithExactly(fetch, 'http://internal.example:8080/import.zip', {
			ignoreSsrfValidation: false,
			allowList: 'internal.example:8080',
		});
		sinon.assert.callOrder(createWriteStream, fetch, pipe);
		sinon.assert.calledOnceWithExactly(pipe, writeStream);

		responseBody.end('downloaded file contents');
		await finished;
		expect(Buffer.concat(chunks).toString()).to.equal('downloaded file contents');
	});

	it('destroys the file stream and marks the operation as failed when SSRF validation rejects the URL', async () => {
		const error = new Error('error-ssrf-validation-failed');
		const writeStream = new PassThrough();
		const destroy = sinon.spy(writeStream, 'destroy');
		fetch.rejects(error);
		createWriteStream.returns(writeStream);

		let thrown: unknown;
		try {
			await executeDownloadPublicImportFile('user-id', 'http://127.0.0.1/import.zip', 'csv');
		} catch (result) {
			thrown = result;
		}

		expect(thrown).to.equal(error);
		sinon.assert.calledOnce(createWriteStream);
		sinon.assert.calledOnce(destroy);
		sinon.assert.calledWithExactly(updateProgress.firstCall, 'importer_downloading_file');
		sinon.assert.calledWithExactly(updateProgress.secondCall, 'importer_import_failed');
	});

	it('keeps local file imports on the existing filesystem path without calling fetch', async () => {
		const writeStream = new PassThrough();
		writeStream.resume();
		const finished = once(writeStream, 'finish');
		createWriteStream.returns(writeStream);

		await executeDownloadPublicImportFile('user-id', __filename, 'csv');
		await finished;

		sinon.assert.notCalled(fetch);
		sinon.assert.calledOnce(createWriteStream);
	});
});
