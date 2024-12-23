import { expect } from 'chai';
import { describe, it } from 'mocha';
import { Headers } from 'node-fetch';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const mocks = {
	settingsGet: sinon.stub(),
	findOneByUsernameIgnoringCase: sinon.stub(),
	findOneById: sinon.stub(),
	utils: {
		serveSvgAvatarInRequestedFormat: sinon.spy(),
		wasFallbackModified: sinon.stub(),
		setCacheAndDispositionHeaders: sinon.spy(),
		serveAvatarFile: sinon.spy(),
	},
	serverFetch: sinon.stub(),
	avatarFindOneByName: sinon.stub(),
	avatarFindOneByUserId: sinon.stub(),
};

const { userAvatarById, userAvatarByUsername } = proxyquire.noCallThru().load('./user', {
	'@rocket.chat/models': {
		Users: {
			findOneByUsernameIgnoringCase: mocks.findOneByUsernameIgnoringCase,
			findOneById: mocks.findOneById,
		},
		Avatars: {
			findOneByName: mocks.avatarFindOneByName,
			findOneByUserId: mocks.avatarFindOneByUserId,
		},
	},
	'../../../app/settings/server': {
		settings: {
			get: mocks.settingsGet,
		},
	},
	'./utils': mocks.utils,
	'@rocket.chat/server-fetch': {
		serverFetch: mocks.serverFetch,
	},
});

describe('#userAvatarById()', () => {
	const response = {
		setHeader: sinon.spy(),
		writeHead: sinon.spy(),
		end: sinon.spy(),
	};
	const next = sinon.spy();

	afterEach(() => {
		mocks.settingsGet.reset();
		mocks.avatarFindOneByUserId.reset();

		response.setHeader.resetHistory();
		response.writeHead.resetHistory();
		response.end.resetHistory();
		next.resetHistory();

		Object.values(mocks.utils).forEach((mock) => ('reset' in mock ? mock.reset() : mock.resetHistory()));
	});

	it(`should do nothing if url is not in request object`, async () => {
		await userAvatarById({}, response, next);
		expect(next.called).to.be.false;
		expect(response.setHeader.called).to.be.false;
		expect(response.writeHead.called).to.be.false;
		expect(response.end.called).to.be.false;
	});

	it(`should write 404 if Id is not provided`, async () => {
		await userAvatarById({ url: '/' }, response, next);
		expect(next.called).to.be.false;
		expect(response.setHeader.called).to.be.false;
		expect(response.writeHead.calledWith(404)).to.be.true;
		expect(response.end.calledOnce).to.be.true;
	});

	it(`should call external provider`, async () => {
		const userId = 'xvf5Tr34';
		const request = { url: `/${userId}` };

		const pipe = sinon.spy();
		const mockResponseHeaders = new Headers();
		mockResponseHeaders.set('header1', 'true');
		mockResponseHeaders.set('header2', 'false');

		mocks.serverFetch.returns({
			headers: mockResponseHeaders,
			body: { pipe },
		});

		mocks.settingsGet.returns('test123/{username}');

		mocks.findOneById.returns({ username: 'jon' });

		await userAvatarById(request, response, next);

		expect(mocks.utils.setCacheAndDispositionHeaders.calledWith(request, response)).to.be.true;
		expect(mocks.findOneById.calledWith(userId)).to.be.true;
		expect(mocks.serverFetch.calledWith('test123/jon')).to.be.true;
		expect(response.setHeader.calledTwice).to.be.true;
		expect(response.setHeader.getCall(0).calledWith('header1', 'true')).to.be.true;
		expect(response.setHeader.getCall(1).calledWith('header2', 'false')).to.be.true;
		expect(pipe.calledWith(response)).to.be.true;
	});

	it(`should serve avatar file if found`, async () => {
		const request = { url: '/jon' };

		const file = { uploadedAt: new Date(0), type: 'image/png', size: 100 };
		mocks.avatarFindOneByUserId.returns(file);

		await userAvatarById(request, response, next);

		expect(mocks.utils.setCacheAndDispositionHeaders.calledWith(request, response)).to.be.true;
		expect(mocks.utils.serveAvatarFile.calledWith(file, request, response, next)).to.be.true;
	});

	it(`should write 304 to head if content is not modified`, async () => {
		const request = { url: '/xyzabc', headers: {} };

		mocks.utils.wasFallbackModified.returns(false);

		await userAvatarById(request, response, next);

		expect(mocks.utils.setCacheAndDispositionHeaders.calledWith(request, response)).to.be.true;
		expect(response.writeHead.calledWith(304)).to.be.true;
		expect(response.end.calledOnce).to.be.true;
	});

	it(`should write 404 if userId is not found`, async () => {
		mocks.utils.wasFallbackModified.returns(true);
		mocks.findOneById.returns(null);

		const userId = 'awdasdaw';
		const request = { url: `/${userId}`, headers: {} };

		await userAvatarById(request, response, next);
		expect(mocks.utils.setCacheAndDispositionHeaders.calledWith(request, response)).to.be.true;

		expect(response.writeHead.calledWith(404)).to.be.true;
		expect(response.end.calledOnce).to.be.true;
	});

	it(`should fallback to SVG if no avatar found`, async () => {
		const userId = '2apso9283';
		const request = { url: `/${userId}`, headers: {} };

		mocks.findOneById.returns({ username: 'jon' });
		mocks.utils.wasFallbackModified.returns(true);

		await userAvatarById(request, response, next);

		expect(mocks.findOneById.calledWith(userId)).to.be.true;
		expect(mocks.utils.setCacheAndDispositionHeaders.calledWith(request, response)).to.be.true;
		expect(mocks.utils.serveSvgAvatarInRequestedFormat.calledWith({ nameOrUsername: 'jon', req: request, res: response })).to.be.true;
	});

	it(`should fallback to SVG with user name if UI_Use_Name_Avatar is true`, async () => {
		const userId = '2apso9283';
		const request = { url: `/${userId}`, headers: {} };

		mocks.findOneById.returns({ username: 'jon', name: 'Doe' });
		mocks.utils.wasFallbackModified.returns(true);
		mocks.settingsGet.withArgs('UI_Use_Name_Avatar').returns(true);

		await userAvatarById(request, response, next);

		expect(mocks.utils.setCacheAndDispositionHeaders.calledWith(request, response)).to.be.true;
		expect(
			mocks.utils.serveSvgAvatarInRequestedFormat.calledWith({ nameOrUsername: 'Doe', req: request, res: response, useAllInitials: true }),
		).to.be.true;
	});
});

describe('#userAvatarByUsername()', () => {
	const response = {
		setHeader: sinon.spy(),
		writeHead: sinon.spy(),
		end: sinon.spy(),
	};
	const next = sinon.spy();

	afterEach(() => {
		mocks.settingsGet.reset();
		mocks.avatarFindOneByName.reset();

		response.setHeader.resetHistory();
		response.writeHead.resetHistory();
		response.end.resetHistory();
		next.resetHistory();

		Object.values(mocks.utils).forEach((mock) => ('reset' in mock ? mock.reset() : mock.resetHistory()));
	});

	it(`should do nothing if url is not in request object`, async () => {
		await userAvatarByUsername({}, response, next);
		expect(next.called).to.be.false;
		expect(response.setHeader.called).to.be.false;
		expect(response.writeHead.called).to.be.false;
		expect(response.end.called).to.be.false;
	});

	it(`should write 404 if username is not provided`, async () => {
		await userAvatarByUsername({ url: '/' }, response, next);
		expect(next.called).to.be.false;
		expect(response.setHeader.called).to.be.false;
		expect(response.writeHead.calledWith(404)).to.be.true;
		expect(response.end.calledOnce).to.be.true;
	});

	it(`should call external provider`, async () => {
		const request = { url: '/jon' };

		const pipe = sinon.spy();
		const mockResponseHeaders = new Headers();
		mockResponseHeaders.set('header1', 'true');
		mockResponseHeaders.set('header2', 'false');

		mocks.serverFetch.returns({
			headers: mockResponseHeaders,
			body: { pipe },
		});

		mocks.settingsGet.returns('test123/{username}');

		await userAvatarByUsername(request, response, next);

		expect(mocks.serverFetch.calledWith('test123/jon')).to.be.true;
		expect(mocks.utils.setCacheAndDispositionHeaders.calledWith(request, response)).to.be.true;
		expect(response.setHeader.calledTwice).to.be.true;
		expect(response.setHeader.getCall(0).calledWith('header1', 'true')).to.be.true;
		expect(response.setHeader.getCall(1).calledWith('header2', 'false')).to.be.true;
		expect(pipe.calledWith(response)).to.be.true;
	});

	describe('should serve svg if requestUsername starts with @', () => {
		it('should serve SVG and useAllInitials should be false', async () => {
			const request = { url: '/@jon' };

			mocks.settingsGet.returns(false);

			await userAvatarByUsername(request, response, next);

			expect(mocks.utils.setCacheAndDispositionHeaders.calledWith(request, response)).to.be.true;
			expect(
				mocks.utils.serveSvgAvatarInRequestedFormat.calledWith({
					nameOrUsername: 'jon',
					req: request,
					res: response,
					useAllInitials: false,
				}),
			).to.be.true;
		});

		it('should serve SVG and useAllInitials should be true', async () => {
			const request = { url: '/@baba yaga' };

			mocks.settingsGet.withArgs('UI_Use_Name_Avatar').returns(true);

			await userAvatarByUsername(request, response, next);

			expect(mocks.utils.setCacheAndDispositionHeaders.calledWith(request, response)).to.be.true;
			expect(
				mocks.utils.serveSvgAvatarInRequestedFormat.calledWith({
					nameOrUsername: 'baba yaga',
					req: request,
					res: response,
					useAllInitials: true,
				}),
			).to.be.true;
		});
	});

	it(`should serve avatar file if found`, async () => {
		const request = { url: '/jon' };

		const file = { uploadedAt: new Date(0), type: 'image/png', size: 100 };
		mocks.avatarFindOneByName.returns(file);

		await userAvatarByUsername(request, response, next);

		expect(mocks.utils.setCacheAndDispositionHeaders.calledWith(request, response)).to.be.true;
		expect(mocks.utils.serveAvatarFile.calledWith(file, request, response, next)).to.be.true;
	});

	it(`should write 304 to head if content is not modified`, async () => {
		const request = { url: '/jon', headers: {} };

		mocks.utils.wasFallbackModified.returns(false);
		await userAvatarByUsername(request, response, next);

		expect(mocks.utils.setCacheAndDispositionHeaders.calledWith(request, response)).to.be.true;
		expect(response.writeHead.calledWith(304)).to.be.true;
		expect(response.end.calledOnce).to.be.true;
	});

	it(`should fallback to SVG if no avatar found`, async () => {
		const request = { url: '/jon', headers: {} };

		mocks.utils.wasFallbackModified.returns(true);
		await userAvatarByUsername(request, response, next);

		expect(mocks.utils.setCacheAndDispositionHeaders.calledWith(request, response)).to.be.true;
		expect(mocks.utils.serveSvgAvatarInRequestedFormat.calledWith({ nameOrUsername: 'jon', req: request, res: response })).to.be.true;
	});

	it(`should fallback to SVG with user name if UI_Use_Name_Avatar is true`, async () => {
		const request = { url: '/jon', headers: {} };

		mocks.utils.wasFallbackModified.returns(true);
		mocks.settingsGet.withArgs('UI_Use_Name_Avatar').returns(true);
		mocks.findOneByUsernameIgnoringCase.returns({ name: 'Doe' });

		await userAvatarByUsername(request, response, next);

		expect(mocks.utils.setCacheAndDispositionHeaders.calledWith(request, response)).to.be.true;
		expect(
			mocks.utils.serveSvgAvatarInRequestedFormat.calledWith({ nameOrUsername: 'Doe', req: request, res: response, useAllInitials: true }),
		).to.be.true;
	});
});
