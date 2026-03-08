import { Readable } from 'stream';

import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

type FakeResponseOptions = {
	status?: number;
	contentType?: string;
	contentLength?: string | null;
	chunks?: Buffer[];
};

const createResponse = ({ status = 200, contentType = 'image/png', contentLength = null, chunks = [] }: FakeResponseOptions) => ({
	status,
	headers: {
		get(name: string) {
			if (name === 'content-type') {
				return contentType;
			}

			if (name === 'content-length') {
				return contentLength;
			}

			return null;
		},
	},
	body: Readable.from(chunks),
	arrayBuffer: async () => {
		const buffer = Buffer.concat(chunks);
		return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
	},
});

describe('setUserAvatar', () => {
	const user = { _id: 'user-id', username: 'alice' };

	const createStubs = () => {
		const fileStore = {
			deleteByName: sinon.stub().resolves(),
			insert: sinon.stub().resolves({ etag: 'etag' }),
		};

		return {
			fileStore,
			Users: {
				setAvatarData: sinon.stub().resolves(),
				findOneById: sinon.stub().resolves(user),
			},
			FileUpload: {
				getStore: sinon.stub().returns(fileStore),
			},
			settings: {
				get: sinon.stub().callsFake((key: string) => {
					if (key === 'SSRF_Allowlist') {
						return '';
					}

					if (key === 'FileUpload_MaxFileSize') {
						return 5;
					}

					return undefined;
				}),
			},
			fetch: sinon.stub(),
			api: {
				broadcast: sinon.stub(),
			},
			onceTransactionCommitedSuccessfully: sinon.stub().callsFake(async (cb: () => Promise<void> | void) => cb()),
			SystemLogger: {
				info: sinon.stub(),
			},
			setTimeout: sinon.stub(global, 'setTimeout').callsFake((fn: any) => {
				if (typeof fn === 'function') {
					void fn();
				}

				return 0 as unknown as NodeJS.Timeout;
			}),
		};
	};

	afterEach(() => {
		sinon.restore();
	});

	it('should reject avatar URLs when declared content-length exceeds configured max size', async () => {
		const stubs = createStubs();
		stubs.fetch.resolves(createResponse({ contentLength: '10', chunks: [Buffer.from('a')] }));

		const { setUserAvatar } = proxyquire.noCallThru().load('../../../../../../app/lib/server/functions/setUserAvatar', {
			'meteor/meteor': { Meteor: { Error } },
			'@rocket.chat/models': { Users: stubs.Users },
			'@rocket.chat/core-services': { api: stubs.api },
			'@rocket.chat/server-fetch': { serverFetch: stubs.fetch },
			'../../../file-upload/server': { FileUpload: stubs.FileUpload },
			'../../../settings/server': { settings: stubs.settings },
			'../../../file/server': { RocketChatFile: { dataURIParse: sinon.stub() } },
			'../../../../server/database/utils': { onceTransactionCommitedSuccessfully: stubs.onceTransactionCommitedSuccessfully },
			'../../../../server/lib/logger/system': { SystemLogger: stubs.SystemLogger },
			'../../../authorization/server/functions/hasPermission': { hasPermissionAsync: sinon.stub() },
		});

		let error;
		try {
			await setUserAvatar(user, 'https://example.com/avatar.png', undefined, 'url');
		} catch (e) {
			error = e;
		}

		expect(error).to.be.instanceOf(Error);
		expect((error as Error).message).to.equal('error-avatar-exceeds-size-limit');
		expect(stubs.fileStore.insert.called).to.be.false;
		expect(stubs.setTimeout.called).to.be.false;
	});

	it('should reject avatar URLs when streamed content size exceeds configured max size', async () => {
		const stubs = createStubs();
		stubs.fetch.resolves(createResponse({ contentLength: null, chunks: [Buffer.alloc(4), Buffer.alloc(4)] }));

		const { setUserAvatar } = proxyquire.noCallThru().load('../../../../../../app/lib/server/functions/setUserAvatar', {
			'meteor/meteor': { Meteor: { Error } },
			'@rocket.chat/models': { Users: stubs.Users },
			'@rocket.chat/core-services': { api: stubs.api },
			'@rocket.chat/server-fetch': { serverFetch: stubs.fetch },
			'../../../file-upload/server': { FileUpload: stubs.FileUpload },
			'../../../settings/server': { settings: stubs.settings },
			'../../../file/server': { RocketChatFile: { dataURIParse: sinon.stub() } },
			'../../../../server/database/utils': { onceTransactionCommitedSuccessfully: stubs.onceTransactionCommitedSuccessfully },
			'../../../../server/lib/logger/system': { SystemLogger: stubs.SystemLogger },
			'../../../authorization/server/functions/hasPermission': { hasPermissionAsync: sinon.stub() },
		});

		let error;
		try {
			await setUserAvatar(user, 'https://example.com/avatar.png', undefined, 'url');
		} catch (e) {
			error = e;
		}

		expect(error).to.be.instanceOf(Error);
		expect((error as Error).message).to.equal('error-avatar-exceeds-size-limit');
		expect(stubs.fileStore.insert.called).to.be.false;
		expect(stubs.setTimeout.called).to.be.false;
	});

	it('should accept avatar URLs within configured max size and persist the file', async () => {
		const stubs = createStubs();
		stubs.settings.get.withArgs('FileUpload_MaxFileSize').returns(20);
		stubs.fetch.resolves(createResponse({ contentLength: '4', chunks: [Buffer.from('test')] }));

		const { setUserAvatar } = proxyquire.noCallThru().load('../../../../../../app/lib/server/functions/setUserAvatar', {
			'meteor/meteor': { Meteor: { Error } },
			'@rocket.chat/models': { Users: stubs.Users },
			'@rocket.chat/core-services': { api: stubs.api },
			'@rocket.chat/server-fetch': { serverFetch: stubs.fetch },
			'../../../file-upload/server': { FileUpload: stubs.FileUpload },
			'../../../settings/server': { settings: stubs.settings },
			'../../../file/server': { RocketChatFile: { dataURIParse: sinon.stub() } },
			'../../../../server/database/utils': { onceTransactionCommitedSuccessfully: stubs.onceTransactionCommitedSuccessfully },
			'../../../../server/lib/logger/system': { SystemLogger: stubs.SystemLogger },
			'../../../authorization/server/functions/hasPermission': { hasPermissionAsync: sinon.stub() },
		});

		await setUserAvatar(user, 'https://example.com/avatar.png', undefined, 'url');

		expect(stubs.fileStore.deleteByName.calledOnceWith(user.username)).to.be.true;
		expect(stubs.fileStore.insert.calledOnce).to.be.true;
		const [fileData, buffer] = stubs.fileStore.insert.firstCall.args;
		expect(fileData.size).to.equal(4);
		expect(buffer.toString()).to.equal('test');
		expect(stubs.api.broadcast.calledOnce).to.be.true;
		expect(stubs.setTimeout.calledOnce).to.be.true;
	});
});
