import { expect } from 'chai';
import { describe, it } from 'mocha';
import { Headers } from 'node-fetch';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const mocks = {
	settingsGet: sinon.stub(),
	findOneByUsernameIgnoringCase: sinon.stub(),
	utils: {
		serveSvgAvatarInRequestedFormat: sinon.spy(),
		wasFallbackModified: sinon.stub(),
		setCacheAndDispositionHeaders: sinon.spy(),
		serveAvatarFile: sinon.spy(),
	},
	serverFetch: sinon.stub(),
	avatarFindOneByName: sinon.stub(),
};

const { userAvatarByUsername } = proxyquire.noCallThru().load('./user', {
	'@rocket.chat/models': {
		Users: {
			findOneByUsernameIgnoringCase: mocks.findOneByUsernameIgnoringCase,
		},
		Avatars: {
			findOneByName: mocks.avatarFindOneByName,
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

	it(`should serve svg if requestUsername starts with @`, async () => {
		const request = { url: '/@jon' };

		await userAvatarByUsername(request, response, next);

		expect(mocks.utils.setCacheAndDispositionHeaders.calledWith(request, response)).to.be.true;
		expect(mocks.utils.serveSvgAvatarInRequestedFormat.calledWith({ nameOrUsername: 'jon', req: request, res: response })).to.be.true;
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
		expect(mocks.utils.serveSvgAvatarInRequestedFormat.calledWith({ nameOrUsername: 'Doe', req: request, res: response })).to.be.true;
	});
});
