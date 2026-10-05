import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const sandbox = sinon.createSandbox();

const mocks = {
	contactFindOneById: sandbox.stub(),
	findOneContactAvatar: sandbox.stub(),
	findOneByIdAndLoginToken: sandbox.stub(),
	hashLoginToken: sandbox.stub(),
	cookieGet: sandbox.stub(),
	utils: {
		serveSvgAvatarInRequestedFormat: sandbox.spy(),
		wasFallbackModified: sandbox.stub(),
		setCacheAndDispositionHeaders: sandbox.spy(),
		serveAvatarFile: sandbox.spy(),
	},
};

const { contactAvatar } = proxyquire.noCallThru().load('./contact', {
	'@rocket.chat/account-utils': { hashLoginToken: mocks.hashLoginToken },
	'@rocket.chat/models': {
		Contacts: { findOneById: mocks.contactFindOneById },
		Avatars: { findOneContactAvatar: mocks.findOneContactAvatar },
		Users: { findOneByIdAndLoginToken: mocks.findOneByIdAndLoginToken },
	},
	'meteor/ostrio:cookies': {
		Cookies: class {
			public get = mocks.cookieGet;
		},
	},
	'./utils': mocks.utils,
});

const OWNER = 'owner-uid';
const CONTACT = { _id: 'c1', uid: OWNER, displayName: 'John Doe' };

const byQuery = (uid: string, token: string) => ({
	url: `/c1?rc_uid=${uid}&rc_token=${token}`,
	query: { rc_uid: uid, rc_token: token },
	headers: {},
});

const byCookie = () => ({ url: '/c1', query: {}, headers: { cookie: 'rc_uid=owner-uid; rc_token=raw-token' } });

describe('#contactAvatar()', () => {
	const response = { setHeader: sandbox.spy(), writeHead: sandbox.spy(), end: sandbox.spy() };
	const next = sandbox.spy();

	beforeEach(() => {
		sandbox.reset();

		mocks.contactFindOneById.resolves(CONTACT);
		mocks.hashLoginToken.returns('hashed-token');
		mocks.findOneByIdAndLoginToken.resolves({ _id: OWNER });
		mocks.cookieGet.returns(undefined);
		mocks.findOneContactAvatar.resolves(null);
		mocks.utils.wasFallbackModified.returns(true);
	});

	describe('who may see a contact photo', () => {
		it('serves it to the user whose address book the contact is in', async () => {
			const file = { _id: 'a1', uploadedAt: new Date(0), type: 'image/jpeg', size: 100 };
			mocks.findOneContactAvatar.resolves(file);
			const request = byQuery(OWNER, 'raw-token');

			await contactAvatar(request, response, next);

			expect(mocks.utils.serveAvatarFile.calledWith(file, request, response, next)).to.be.true;
			expect(response.writeHead.called).to.be.false;
		});

		it('refuses a signed in user asking for someone else`s contact', async () => {
			mocks.findOneByIdAndLoginToken.resolves({ _id: 'someone-else' });

			await contactAvatar(byQuery('someone-else', 'raw-token'), response, next);

			expect(response.writeHead.calledWith(404)).to.be.true;
			expect(mocks.utils.serveAvatarFile.called).to.be.false;
			expect(mocks.utils.serveSvgAvatarInRequestedFormat.called).to.be.false;
		});

		it('refuses a request that carries no credentials at all', async () => {
			await contactAvatar({ url: '/c1', query: {}, headers: {} }, response, next);

			expect(response.writeHead.calledWith(404)).to.be.true;
			expect(mocks.findOneByIdAndLoginToken.called).to.be.false;
		});

		it('refuses the owner`s id paired with a stale token', async () => {
			mocks.findOneByIdAndLoginToken.resolves(null);

			await contactAvatar(byQuery(OWNER, 'stale-token'), response, next);

			expect(response.writeHead.calledWith(404)).to.be.true;
			expect(mocks.utils.serveAvatarFile.called).to.be.false;
		});

		it('hashes the token before matching it, so what travels in the url is never what is stored', async () => {
			await contactAvatar(byQuery(OWNER, 'raw-token'), response, next);

			expect(mocks.hashLoginToken.calledWith('raw-token')).to.be.true;
			expect(mocks.findOneByIdAndLoginToken.calledWith(OWNER, 'hashed-token')).to.be.true;
		});

		it('accepts the session cookies when the url carries no credentials', async () => {
			mocks.cookieGet.withArgs('rc_uid').returns(OWNER);
			mocks.cookieGet.withArgs('rc_token').returns('raw-token');

			await contactAvatar(byCookie(), response, next);

			expect(mocks.utils.serveSvgAvatarInRequestedFormat.called).to.be.true;
			expect(response.writeHead.calledWith(404)).to.be.false;
		});

		it('answers 404 for a contact that does not exist, without looking any user up', async () => {
			mocks.contactFindOneById.resolves(null);

			await contactAvatar(byQuery(OWNER, 'raw-token'), response, next);

			expect(response.writeHead.calledWith(404)).to.be.true;
			expect(mocks.findOneByIdAndLoginToken.called).to.be.false;
		});

		it('does nothing at all without a url to read the contact id from', async () => {
			await contactAvatar({}, response, next);

			expect(response.writeHead.called).to.be.false;
			expect(mocks.contactFindOneById.called).to.be.false;
		});
	});

	describe('a contact without a stored photo', () => {
		it('falls back to initials drawn from the display name', async () => {
			const request = byQuery(OWNER, 'raw-token');

			await contactAvatar(request, response, next);

			expect(
				mocks.utils.serveSvgAvatarInRequestedFormat.calledWith({
					nameOrUsername: 'John Doe',
					req: request,
					res: response,
					useAllInitials: true,
				}),
			).to.be.true;
		});

		it('answers 304 when the caller already holds that fallback', async () => {
			mocks.utils.wasFallbackModified.returns(false);

			await contactAvatar(byQuery(OWNER, 'raw-token'), response, next);

			expect(response.writeHead.calledWith(304)).to.be.true;
			expect(mocks.utils.serveSvgAvatarInRequestedFormat.called).to.be.false;
		});
	});
});
