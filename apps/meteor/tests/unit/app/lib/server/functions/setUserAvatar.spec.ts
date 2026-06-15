import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

class MeteorError extends Error {
	constructor(
		public error: string,
		public reason?: string,
		public details?: Record<string, unknown>,
	) {
		super(error);
	}
}

const createResponse = ({
	status = 200,
	headers = {},
	arrayBuffer,
}: {
	status?: number;
	headers?: Record<string, string>;
	arrayBuffer?: sinon.SinonStub;
}) => ({
	status,
	headers: {
		get: (key: string) => headers[key.toLowerCase()] || null,
	},
	arrayBuffer: arrayBuffer ?? sinon.stub().resolves(Buffer.from('1234')),
});

describe('setUserAvatar', () => {
	const user = { _id: 'user-id', username: 'tester' };
	const fileStore = {
		deleteByName: sinon.stub().resolves(),
		insert: sinon.stub().resolves({ etag: 'etag' }),
	};

	const stubs = {
		Users: {
			setAvatarData: sinon.stub().resolves(),
			findOneById: sinon.stub(),
		},
		fetch: sinon.stub(),
		settings: {
			get: sinon.stub(),
		},
		SystemLogger: {
			info: sinon.stub(),
		},
		FileUpload: {
			getStore: sinon.stub().returns(fileStore),
		},
		RocketChatFile: {
			dataURIParse: sinon.stub(),
		},
		api: {
			broadcast: sinon.stub(),
		},
		hasPermissionAsync: sinon.stub(),
	};

	const { setUserAvatar } = proxyquire.noCallThru().load('../../../../../../app/lib/server/functions/setUserAvatar', {
		'@rocket.chat/core-services': { api: stubs.api },
		'@rocket.chat/models': { Users: stubs.Users },
		'@rocket.chat/server-fetch': { serverFetch: stubs.fetch },
		'meteor/meteor': { Meteor: { Error: MeteorError } },
		'../../../../server/database/utils': { onceTransactionCommitedSuccessfully: async (cb: any, _sess: any) => cb() },
		'../../../../server/lib/logger/system': { SystemLogger: stubs.SystemLogger },
		'../../../authorization/server/functions/hasPermission': { hasPermissionAsync: stubs.hasPermissionAsync },
		'../../../file/server': { RocketChatFile: stubs.RocketChatFile },
		'../../../file-upload/server': { FileUpload: stubs.FileUpload },
		'../../../settings/server': { settings: stubs.settings },
	});

	beforeEach(() => {
		stubs.settings.get.callsFake((key: string) => {
			if (key === 'SSRF_Allowlist') {
				return '*';
			}

			if (key === 'FileUpload_MaxFileSize') {
				return 4;
			}

			return undefined;
		});
	});

	afterEach(() => {
		sinon.restore();
		fileStore.deleteByName.resetHistory();
		fileStore.insert.resetHistory();
		stubs.Users.setAvatarData.resetHistory();
		stubs.fetch.resetHistory();
		stubs.settings.get.resetHistory();
		stubs.SystemLogger.info.resetHistory();
		stubs.api.broadcast.resetHistory();
	});

	it('rejects avatar url when content-length exceeds max size', async () => {
		stubs.fetch.resolves(
			createResponse({
				headers: {
					'content-type': 'image/png',
				},
				arrayBuffer: sinon.stub().rejects(Object.assign(new Error('too large'), { type: 'max-size' })),
			}),
		);

		await expect(setUserAvatar(user, 'https://example.com/avatar.png', '', 'url')).to.be.rejectedWith('error-file-too-large');
		expect(fileStore.insert.called).to.be.false;
	});

	it('rejects avatar url when response body exceeds max size', async () => {
		stubs.fetch.resolves(
			createResponse({
				headers: {
					'content-type': 'image/png',
				},
				arrayBuffer: sinon.stub().rejects(Object.assign(new Error('too large'), { type: 'max-size' })),
			}),
		);

		await expect(setUserAvatar(user, 'https://example.com/avatar.png', '', 'url')).to.be.rejectedWith('error-file-too-large');
		expect(fileStore.insert.called).to.be.false;
	});

	it('rejects avatar url when response exceeds lied content-length', async () => {
		stubs.fetch.resolves(
			createResponse({
				headers: {
					'content-type': 'image/png',
					'content-length': '2',
				},
				arrayBuffer: sinon.stub().rejects(Object.assign(new Error('too large'), { type: 'max-size' })),
			}),
		);

		await expect(setUserAvatar(user, 'https://example.com/avatar.png', '', 'url')).to.be.rejectedWith('error-file-too-large');
		expect(fileStore.insert.called).to.be.false;
	});

	it('rejects non-image avatar url content type', async () => {
		stubs.fetch.resolves(
			createResponse({
				headers: {
					'content-type': 'text/plain',
				},
			}),
		);

		await expect(setUserAvatar(user, 'https://example.com/avatar.txt', '', 'url')).to.be.rejectedWith('error-avatar-invalid-url');
		expect(fileStore.insert.called).to.be.false;
	});

	it('rejects content types that only contain image slash in parameters', async () => {
		stubs.fetch.resolves(
			createResponse({
				headers: {
					'content-type': 'text/plain; note=image/png',
				},
			}),
		);

		await expect(setUserAvatar(user, 'https://example.com/avatar.txt', '', 'url')).to.be.rejectedWith('error-avatar-invalid-url');
		expect(fileStore.insert.called).to.be.false;
	});

	it('stores avatar when streamed image stays within limit', async () => {
		stubs.fetch.resolves(
			createResponse({
				headers: {
					'content-type': 'image/png',
				},
				arrayBuffer: sinon.stub().resolves(Buffer.from('1234')),
			}),
		);

		await setUserAvatar(user, 'https://example.com/avatar.png', '', 'url');

		expect(fileStore.insert.calledOnce).to.be.true;
		expect(fileStore.insert.firstCall.args[0]).to.deep.include({
			userId: user._id,
			type: 'image/png',
			size: 4,
		});
		expect(fileStore.insert.firstCall.args[1].equals(Buffer.from('1234'))).to.be.true;
		expect(stubs.fetch.firstCall.args[1]).to.deep.include({
			size: 4,
			timeout: 20_000,
		});
	});

	it('falls back to default max file size when setting is negative', async () => {
		stubs.settings.get.callsFake((key: string) => {
			if (key === 'SSRF_Allowlist') {
				return '*';
			}

			if (key === 'FileUpload_MaxFileSize') {
				return -1;
			}

			return undefined;
		});

		stubs.fetch.resolves(
			createResponse({
				headers: {
					'content-type': 'image/png',
				},
				arrayBuffer: sinon.stub().resolves(Buffer.from('1234567890')),
			}),
		);

		await setUserAvatar(user, 'https://example.com/avatar.png', '', 'url');

		expect(fileStore.insert.calledOnce).to.be.true;
		expect(fileStore.insert.firstCall.args[0]).to.deep.include({
			userId: user._id,
			type: 'image/png',
			size: 10,
		});
	});

	it('rejects avatar url when body read times out', async () => {
		stubs.fetch.resolves(
			createResponse({
				headers: {
					'content-type': 'image/png',
				},
				arrayBuffer: sinon.stub().rejects(Object.assign(new Error('Response timeout'), { type: 'body-timeout' })),
			}),
		);

		await expect(setUserAvatar(user, 'https://example.com/avatar.png', '', 'url')).to.be.rejectedWith('error-avatar-download-timeout');
		expect(fileStore.insert.called).to.be.false;
	});

	it('maps fetch abort errors to avatar download timeout', async () => {
		const abortError = Object.assign(new Error('The operation was aborted'), { name: 'AbortError' });

		stubs.fetch.rejects(abortError);

		await expect(setUserAvatar(user, 'https://example.com/avatar.png', '', 'url')).to.be.rejectedWith('error-avatar-download-timeout');
		expect(fileStore.insert.called).to.be.false;
	});

	it('redacts malformed avatar urls in logs', async () => {
		const invalidUrl = 'https://exa mple.com/avatar.png?token=secret';

		stubs.fetch.rejects(new Error('invalid url'));

		await expect(setUserAvatar(user, invalidUrl, '', 'url')).to.be.rejectedWith('error-avatar-invalid-url');
		expect(stubs.SystemLogger.info.calledOnce).to.be.true;
		expect(stubs.SystemLogger.info.firstCall.args[0]).to.deep.include({
			url: '[invalid-url]',
		});
	});
});
