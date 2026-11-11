import type { IncomingMessage, ServerResponse } from 'node:http';
import { beforeEach, describe, it } from 'node:test';

import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const sandbox = sinon.createSandbox();

const connectHandlersUse = sandbox.stub();
const settingsGet = sandbox.stub();
const getStore = sandbox.stub();
const UserDataFiles = { findOneById: sandbox.stub() };
const Users = { findOneByIdAndLoginToken: sandbox.stub() };

proxyquire.noCallThru().load('./userDataDownload', {
	'@rocket.chat/account-utils': { hashLoginToken: (token: string) => `hashed:${token}` },
	'@rocket.chat/models': { UserDataFiles, Users },
	'meteor/webapp': { WebApp: { connectHandlers: { use: connectHandlersUse } } },
	'../lib/media/file-upload': { FileUpload: { getStore } },
	'../settings': { settings: { get: settingsGet } },
});

const [routePath, userDataDownloadHandler] = connectHandlersUse.firstCall.args as [
	string,
	(req: IncomingMessage, res: ServerResponse, next: () => void) => Promise<void>,
];

const OWNER_ID = 'owner-id';
const OWNER_TOKEN = 'owner-token';
const FILE_ID = 'file-id';

type RequestInit = {
	url?: string;
	query?: Record<string, string>;
	headers?: Record<string, string | string[]>;
};

const createRequest = ({ url = `/${FILE_ID}`, query = {}, headers = {} }: RequestInit = {}) =>
	({ url, query, headers }) as unknown as IncomingMessage;

const createResponse = () => {
	const res = { writeHead: sinon.stub(), end: sinon.stub(), setHeader: sinon.stub() };
	res.writeHead.returns(res);
	return res;
};

const storeGet = sandbox.stub();
const next = sandbox.stub();
const file = { _id: FILE_ID, userId: OWNER_ID };

const download = async (init?: RequestInit) => {
	const req = createRequest(init);
	const res = createResponse();
	await userDataDownloadHandler(req, res as unknown as ServerResponse, next);
	return { req, res };
};

const expectRejectedWith = (res: ReturnType<typeof createResponse>, status: number) => {
	expect(res.writeHead.calledOnceWithExactly(status)).to.be.equal(true);
	expect(res.end.calledOnce).to.be.equal(true);
	expect(storeGet.called).to.be.equal(false);
	expect(res.setHeader.called).to.be.equal(false);
};

const expectDelivered = (req: IncomingMessage, res: ReturnType<typeof createResponse>) => {
	expect(storeGet.calledOnceWithExactly(file, req, res, next)).to.be.equal(true);
	expect(res.writeHead.called).to.be.equal(false);
};

describe('userDataDownload route', () => {
	beforeEach(() => {
		sandbox.reset();

		settingsGet.withArgs('UserData_EnableDownload').returns(true);
		UserDataFiles.findOneById.resolves(file);
		Users.findOneByIdAndLoginToken.callsFake(async (uid: string, hashedToken: string) =>
			uid === OWNER_ID && hashedToken === `hashed:${OWNER_TOKEN}` ? { _id: OWNER_ID } : null,
		);
		storeGet.resolves();
		getStore.withArgs('UserDataFiles').returns({ get: storeGet });
	});

	it('should serve downloads under /data-export/', () => {
		expect(routePath).to.be.equal('/data-export/');
	});

	describe('owner credential validation', () => {
		it('should deliver the file to its owner authenticated through query parameters', async () => {
			const { req, res } = await download({ query: { rc_uid: OWNER_ID, rc_token: OWNER_TOKEN } });

			expect(
				Users.findOneByIdAndLoginToken.calledOnceWithExactly(OWNER_ID, `hashed:${OWNER_TOKEN}`, { projection: { _id: 1 } }),
			).to.be.equal(true);
			expectDelivered(req, res);
		});

		it('should fall back to owner credentials in cookies when the query credentials are not valid', async () => {
			const { req, res } = await download({
				query: { rc_uid: OWNER_ID, rc_token: 'expired-token' },
				headers: { cookie: `rc_uid=${OWNER_ID}; rc_token=${OWNER_TOKEN}` },
			});

			expect(Users.findOneByIdAndLoginToken.callCount).to.be.equal(2);
			expectDelivered(req, res);
		});

		it('should deliver the file to its owner authenticated through the auth headers', async () => {
			const { req, res } = await download({ headers: { 'x-user-id': OWNER_ID, 'x-auth-token': OWNER_TOKEN } });

			expectDelivered(req, res);
		});

		it('should try every pair of repeated auth headers until one belongs to the owner', async () => {
			const { req, res } = await download({
				headers: { 'x-user-id': ['other-user', OWNER_ID], 'x-auth-token': ['stale-token', OWNER_TOKEN] },
			});

			expect(Users.findOneByIdAndLoginToken.calledWith(OWNER_ID, 'hashed:stale-token')).to.be.equal(true);
			expect(Users.findOneByIdAndLoginToken.calledWith(OWNER_ID, `hashed:${OWNER_TOKEN}`)).to.be.equal(true);
			expectDelivered(req, res);
		});

		it('should reject a request without any credentials', async () => {
			const { res } = await download();

			expect(Users.findOneByIdAndLoginToken.called).to.be.equal(false);
			expectRejectedWith(res, 403);
		});

		it('should reject valid credentials of another user without looking them up', async () => {
			const otherUser = { uid: 'other-user', token: 'other-token' };

			const { res } = await download({
				query: { rc_uid: otherUser.uid, rc_token: otherUser.token },
				headers: {
					'cookie': `rc_uid=${otherUser.uid}; rc_token=${otherUser.token}`,
					'x-user-id': otherUser.uid,
					'x-auth-token': otherUser.token,
				},
			});

			expect(Users.findOneByIdAndLoginToken.called).to.be.equal(false);
			expectRejectedWith(res, 403);
		});

		it('should reject the owner id when no supplied token is a valid login token', async () => {
			const { res } = await download({
				query: { rc_uid: OWNER_ID, rc_token: 'wrong-token' },
				headers: {
					'cookie': `rc_uid=${OWNER_ID}; rc_token=wrong-token`,
					'x-user-id': OWNER_ID,
					'x-auth-token': 'wrong-token',
				},
			});

			expect(Users.findOneByIdAndLoginToken.callCount).to.be.equal(3);
			expectRejectedWith(res, 403);
		});

		it('should reject the owner id when it comes without a token', async () => {
			const { res } = await download({ query: { rc_uid: OWNER_ID }, headers: { 'x-user-id': OWNER_ID } });

			expect(Users.findOneByIdAndLoginToken.called).to.be.equal(false);
			expectRejectedWith(res, 403);
		});
	});

	describe('download rejection responses', () => {
		it('should reject with 403 when user data downloads are disabled', async () => {
			settingsGet.withArgs('UserData_EnableDownload').returns(false);

			const { res } = await download({ query: { rc_uid: OWNER_ID, rc_token: OWNER_TOKEN } });

			expect(UserDataFiles.findOneById.called).to.be.equal(false);
			expectRejectedWith(res, 403);
		});

		it('should reject with 404 when the path is not a single file id', async () => {
			const { res } = await download({ url: `/${FILE_ID}/extra`, query: { rc_uid: OWNER_ID, rc_token: OWNER_TOKEN } });

			expect(UserDataFiles.findOneById.called).to.be.equal(false);
			expectRejectedWith(res, 404);
		});

		it('should reject with 404 when the path has no file id', async () => {
			const { res } = await download({ url: '/' });

			expect(UserDataFiles.findOneById.called).to.be.equal(false);
			expectRejectedWith(res, 404);
		});

		it('should reject with 404 when the request has no url', async () => {
			const res = createResponse();

			await userDataDownloadHandler({ query: {}, headers: {} } as unknown as IncomingMessage, res as unknown as ServerResponse, next);

			expect(UserDataFiles.findOneById.called).to.be.equal(false);
			expectRejectedWith(res, 404);
		});

		it('should look the file up by its decoded id', async () => {
			UserDataFiles.findOneById.resolves(null);

			await download({ url: '/export%20file' });

			expect(UserDataFiles.findOneById.calledOnceWithExactly('export file')).to.be.equal(true);
		});

		it('should reject with 404 when the file does not exist', async () => {
			UserDataFiles.findOneById.resolves(null);

			const { res } = await download({ query: { rc_uid: OWNER_ID, rc_token: OWNER_TOKEN } });

			expect(Users.findOneByIdAndLoginToken.called).to.be.equal(false);
			expectRejectedWith(res, 404);
		});

		it('should reject with 403 when the file has no owner', async () => {
			UserDataFiles.findOneById.resolves({ _id: FILE_ID });

			const { res } = await download({ query: { rc_uid: OWNER_ID, rc_token: OWNER_TOKEN } });

			expect(Users.findOneByIdAndLoginToken.called).to.be.equal(false);
			expectRejectedWith(res, 403);
		});

		it('should reject the owner with 403 when the user data file store is unavailable', async () => {
			getStore.withArgs('UserDataFiles').returns(undefined);

			const { res } = await download({ query: { rc_uid: OWNER_ID, rc_token: OWNER_TOKEN } });

			expectRejectedWith(res, 403);
		});

		it('should reject the owner with 403 when the user data file store cannot retrieve files', async () => {
			getStore.withArgs('UserDataFiles').returns({});

			const { res } = await download({ query: { rc_uid: OWNER_ID, rc_token: OWNER_TOKEN } });

			expectRejectedWith(res, 403);
		});
	});

	describe('authorized file delivery', () => {
		it('should set the security and caching headers before handing the file to the store', async () => {
			const { res } = await download({ query: { rc_uid: OWNER_ID, rc_token: OWNER_TOKEN } });

			expect(res.setHeader.calledWithExactly('Content-Security-Policy', "default-src 'none'")).to.be.equal(true);
			expect(res.setHeader.calledWithExactly('Cache-Control', 'max-age=31536000')).to.be.equal(true);
			expect(res.setHeader.lastCall.calledBefore(storeGet.firstCall)).to.be.equal(true);
		});
	});
});
