import { expect } from 'chai';
import { describe, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const mocks = {
	settingsGet: sinon.stub(),
	findOneById: sinon.stub(),
	utils: {
		serveSvgAvatarInRequestedFormat: sinon.spy(),
		wasFallbackModified: sinon.stub(),
		setCacheAndDispositionHeaders: sinon.spy(),
		serveAvatarFile: sinon.spy(),
	},
	avatarFindOneByRoomId: sinon.stub(),
	getRoomName: sinon.stub(),
};

class CookiesMock {
	public get = (_key: any, value: any) => value;
}

const { roomAvatar } = proxyquire.noCallThru().load('./room', {
	'@rocket.chat/models': {
		Rooms: {
			findOneById: mocks.findOneById,
		},
		Avatars: {
			findOneByRoomId: mocks.avatarFindOneByRoomId,
		},
	},
	'../../../app/settings/server': {
		settings: {
			get: mocks.settingsGet,
		},
	},
	'./utils': mocks.utils,
	'../../lib/rooms/roomCoordinator': {
		roomCoordinator: {
			getRoomName: mocks.getRoomName,
		},
	},
	'meteor/ostrio:cookies': {
		Cookies: CookiesMock,
	},
});

describe('#roomAvatar()', () => {
	const response = {
		setHeader: sinon.spy(),
		writeHead: sinon.spy(),
		end: sinon.spy(),
	};
	const next = sinon.spy();

	afterEach(() => {
		mocks.settingsGet.reset();
		mocks.avatarFindOneByRoomId.reset();
		mocks.findOneById.reset();

		response.setHeader.resetHistory();
		response.writeHead.resetHistory();
		response.end.resetHistory();
		next.resetHistory();

		Object.values(mocks.utils).forEach((mock) => ('reset' in mock ? mock.reset() : mock.resetHistory()));
	});

	it(`should do nothing if url is not in request object`, async () => {
		await roomAvatar({}, response, next);
		expect(next.called).to.be.false;
		expect(response.setHeader.called).to.be.false;
		expect(response.writeHead.called).to.be.false;
		expect(response.end.called).to.be.false;
	});

	it(`should write 404 if room is not found`, async () => {
		mocks.findOneById.returns(null);
		await roomAvatar({ url: '/' }, response, next);
		expect(next.called).to.be.false;
		expect(response.setHeader.called).to.be.false;
		expect(response.writeHead.calledWith(404)).to.be.true;
		expect(response.end.calledOnce).to.be.true;
	});

	it(`should serve avatar file if found`, async () => {
		const request = { url: '/roomId' };

		const file = { uploadedAt: new Date(0), type: 'image/png', size: 100 };

		mocks.findOneById.withArgs('roomId').returns({ _id: 'roomId' });
		mocks.avatarFindOneByRoomId.withArgs('roomId').returns(file);

		await roomAvatar(request, response, next);

		expect(mocks.utils.setCacheAndDispositionHeaders.calledWith(request, response)).to.be.true;
		expect(mocks.utils.serveAvatarFile.calledWith(file, request, response, next)).to.be.true;
	});

	it(`should serve parent room avatar file if current room avatar is not found`, async () => {
		const request = { url: '/roomId' };

		const file = { uploadedAt: new Date(0), type: 'image/png', size: 100 };

		mocks.findOneById.withArgs('roomId').returns({ _id: 'roomId', prid: 'roomId2' });
		mocks.findOneById.withArgs('roomId2').returns({ _id: 'roomId2' });
		mocks.avatarFindOneByRoomId.withArgs('roomId2').returns(file);

		await roomAvatar(request, response, next);

		expect(mocks.utils.setCacheAndDispositionHeaders.calledWith(request, response)).to.be.true;
		expect(mocks.utils.serveAvatarFile.calledWith(file, request, response, next)).to.be.true;
	});

	it(`should write 304 if fallback content is not modified`, async () => {
		const request = { url: '/roomId', headers: {} };

		mocks.findOneById.withArgs('roomId').returns({ _id: 'roomId' });
		mocks.utils.wasFallbackModified.returns(false);
		await roomAvatar(request, response, next);

		expect(mocks.utils.setCacheAndDispositionHeaders.calledWith(request, response)).to.be.true;
		expect(response.writeHead.calledWith(304)).to.be.true;
		expect(response.end.calledOnce).to.be.true;
	});

	it(`should serve svg fallback if no file found`, async () => {
		const request = { url: '/roomId', headers: { cookie: 'userId' } };

		mocks.utils.wasFallbackModified.returns(true);
		mocks.findOneById.withArgs('roomId').returns({ _id: 'roomId' });
		mocks.getRoomName.returns('roomName');

		await roomAvatar(request, response, next);

		expect(mocks.utils.setCacheAndDispositionHeaders.calledWith(request, response)).to.be.true;
		expect(mocks.utils.serveSvgAvatarInRequestedFormat.calledWith({ nameOrUsername: 'roomName', req: request, res: response })).to.be.true;
	});
});
