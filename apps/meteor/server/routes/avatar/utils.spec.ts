import { expect } from 'chai';
import { describe, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

class CookiesMock {
	public get = (_key: any, value: any) => value;
}

const mocks = {
	settingsGet: sinon.stub(),
	findOneByIdAndLoginToken: sinon.stub(),
	fileUploadGet: sinon.spy(),
};

const {
	getAvatarSizeFromRequest,
	MIN_SVG_AVATAR_SIZE,
	MAX_SVG_AVATAR_SIZE,
	renderSVGLetters,
	setCacheAndDispositionHeaders,
	userCanAccessAvatar,
	wasFallbackModified,
	serveSvgAvatarInRequestedFormat,
	serveAvatarFile,
} = proxyquire.noCallThru().load('./utils', {
	'meteor/ostrio:cookies': {
		Cookies: CookiesMock,
	},
	'../../../../app/utils/server/getURL': {
		getURL: () => '',
	},
	'@rocket.chat/models': {
		Users: {
			findOneByIdAndLoginToken: mocks.findOneByIdAndLoginToken,
		},
	},
	'../../../app/file-upload/server': {
		FileUpload: {
			get: mocks.fileUploadGet,
		},
	},
	'../../../app/settings/server': {
		settings: {
			get: mocks.settingsGet,
		},
	},
	'sharp': () => ({ toFormat: (format: any) => ({ pipe: (res: any) => res.write(format) }) }),
});

describe('#serveAvatarFile()', () => {
	const file = { uploadedAt: new Date(0), type: 'image/png', size: 100 };
	const response = {
		setHeader: sinon.spy(),
		writeHead: sinon.spy(),
		end: sinon.spy(),
	};
	const next = sinon.spy();

	afterEach(() => {
		response.setHeader.resetHistory();
		response.writeHead.resetHistory();
		response.end.resetHistory();
		next.resetHistory();
	});

	it(`should return code 304 if avatar was not modified`, () => {
		serveAvatarFile(file, { headers: { 'if-modified-since': new Date(0).toUTCString() } }, response, next);
		expect(response.setHeader.getCall(0).calledWith('Content-Security-Policy', "default-src 'none'")).to.be.true;
		expect(response.setHeader.getCall(1).calledWith('Last-Modified', new Date(0).toUTCString())).to.be.true;
		expect(response.writeHead.calledWith(304)).to.be.true;
		expect(response.end.calledOnce).to.be.true;
	});

	it('should serve avatar', () => {
		const request = { headers: { 'if-modified-since': new Date(200000).toUTCString() } };
		serveAvatarFile(file, request, response, next);
		expect(response.setHeader.getCall(0).calledWith('Content-Security-Policy', "default-src 'none'")).to.be.true;
		expect(response.setHeader.getCall(1).calledWith('Last-Modified', new Date(0).toUTCString())).to.be.true;
		expect(response.setHeader.getCall(2).calledWith('Content-Type', file.type)).to.be.true;
		expect(response.setHeader.getCall(3).calledWith('Content-Length', file.size)).to.be.true;
		expect(mocks.fileUploadGet.calledWith(file, request, response, next)).to.be.true;
	});
});

describe('#serveSvgAvatarInRequestedFormat()', () => {
	it('should serve SVG avatar in requested format', () => {
		['png', 'jpg', 'jpeg'].forEach((format) => {
			const response = {
				setHeader: sinon.spy(),
				write: sinon.spy(),
				end: sinon.spy(),
			};
			serveSvgAvatarInRequestedFormat({ req: { query: { format, size: 100 } }, res: response, nameOrUsername: 'name' });

			expect(response.setHeader.getCall(0).calledWith('Last-Modified', 'Thu, 01 Jan 2015 00:00:00 GMT')).to.be.true;
			expect(response.setHeader.getCall(1).calledWith('Content-Type', `image/${format}`)).to.be.true;
			expect(response.write.calledWith(format)).to.be.true;
		});
	});
	it(`should serve avatar in SVG format if requested format is not png, jpg or jpeg`, () => {
		const response = {
			setHeader: sinon.spy(),
			write: sinon.spy(),
			end: sinon.spy(),
		};
		serveSvgAvatarInRequestedFormat({ req: { query: { format: 'anythingElse', size: 100 } }, res: response, nameOrUsername: 'name' });

		expect(response.setHeader.getCall(0).calledWith('Last-Modified', 'Thu, 01 Jan 2015 00:00:00 GMT')).to.be.true;
		expect(response.setHeader.getCall(1).calledWith('Content-Type', 'image/svg+xml')).to.be.true;
		expect(response.write.called).to.be.true;
		expect(response.end.calledOnce).to.be.true;
	});
	it(`should default size to 200 if not provided in query`, () => {
		const response = {
			setHeader: sinon.spy(),
			write: sinon.spy(),
			end: sinon.spy(),
		};
		serveSvgAvatarInRequestedFormat({ req: { query: {} }, res: response, nameOrUsername: 'name' });

		expect(response.setHeader.getCall(0).calledWith('Last-Modified', 'Thu, 01 Jan 2015 00:00:00 GMT')).to.be.true;
		expect(response.setHeader.getCall(1).calledWith('Content-Type', 'image/svg+xml')).to.be.true;
		expect(response.write.called).to.be.true;
		expect(response.write.getCall(0).args[0]).to.include('viewBox="0 0 200 200"');
		expect(response.end.calledOnce).to.be.true;
	});
});

describe('#getAvatarSizeFromRequest()', () => {
	it('should return undefined if size is not provided', () => {
		expect(getAvatarSizeFromRequest({ query: {} })).to.equal(undefined);
	});
	it('should return value passed in the request if it falls in the range limit', () => {
		expect(getAvatarSizeFromRequest({ query: { size: 100 } })).to.equal(100);
	});
	it(`should return ${MIN_SVG_AVATAR_SIZE} if requested size is smaller than the limit`, () => {
		expect(getAvatarSizeFromRequest({ query: { size: 2 } })).to.equal(16);
	});
	it(`should return ${MAX_SVG_AVATAR_SIZE} if requested size is bigger than the limit`, () => {
		expect(getAvatarSizeFromRequest({ query: { size: 2000 } })).to.equal(1024);
	});
});

describe('#wasFallbackModified()', () => {
	it('should return true if reqModifiedHeader is different from FALLBACK_LAST_MODIFIED', () => {
		expect(wasFallbackModified('')).to.equal(true);
	});
	it('should false if reqModifiedHeader is the same as FALLBACK_LAST_MODIFIED', () => {
		expect(wasFallbackModified('Thu, 01 Jan 2015 00:00:00 GMT')).to.equal(false);
	});
});

describe('#renderSvgLetters', () => {
	it('should show capitalized initial letter in the svg', () => {
		expect(renderSVGLetters('arthur', 16)).to.include('>\nA\n</text>');
		expect(renderSVGLetters('Bob', 16)).to.include('>\nB\n</text>');
		expect(renderSVGLetters('yan', 16)).to.include('>\nY\n</text>');
		expect(renderSVGLetters('山田 太郎', 16)).to.include('>\n山\n</text>');
	});
	it('should render question mark with color #000', () => {
		expect(renderSVGLetters('?', 16)).to.include('>\n?\n</text>').and.to.include('fill="#000"');
	});
	it('should include size in viewBox property', () => {
		expect(renderSVGLetters('arthur', 16)).to.include('viewBox="0 0 16 16"');
		expect(renderSVGLetters('Bob', 32)).to.include('viewBox="0 0 32 32"');
		expect(renderSVGLetters('yan', 64)).to.include('viewBox="0 0 64 64"');
	});
	it('should return a default size of 125 for a single letter', () => {
		expect(renderSVGLetters('a', 200)).to.include('font-size="125"');
	});
	it('should render a single letter when useAllInitials is false', () => {
		expect(renderSVGLetters('arthur', 16, false)).to.include('>\nA\n');
	});
	it('should render a single letter when useAllInitials is true but username has no spaces', () => {
		expect(renderSVGLetters('arthur', 16, true)).to.include('>\nA\n');
	});
	it('should render more than one letter when useAllInitials is true', () => {
		expect(renderSVGLetters('arthur void', 16, true)).to.include('>\nAV\n');
		expect(renderSVGLetters('arthur void jackson', 16, true)).to.include('>\nAVJ\n');
	});
	it('should cap generated avatar to 3 letters at most', () => {
		expect(renderSVGLetters('arthur void jackson billie', 16, true)).to.include('>\nAVJ\n');
		expect(renderSVGLetters('arthur void jackson billie jean', 16, true)).to.include('>\nAVJ\n');
	});
	it('should decrease the font size when username has more than 1 word', () => {
		expect(renderSVGLetters('arthur void', 200, true)).to.include('font-size="100"');
	});
	it('should decrease the font size when username has 3 words', () => {
		expect(renderSVGLetters('this is three_words', 200, true)).to.include('font-size="80"');
	});
});

describe('#setCacheAndDispositionHeaders', () => {
	it('should set the Cache-Control header based on the query cacheTime', () => {
		const request = {
			query: {
				cacheTime: 100,
			},
		};

		const response = {
			setHeader: sinon.spy(),
		};
		setCacheAndDispositionHeaders(request as any, response as any);
		expect(response.setHeader.calledWith('Cache-Control', 'public, max-age=100')).to.be.true;
		expect(response.setHeader.calledWith('Content-Disposition', 'inline')).to.be.true;
	});

	it('should set the Cache-Control header based on the setting if the query cacheTime is not set', () => {
		const request = {
			query: {},
		};

		const response = {
			setHeader: sinon.spy(),
		};

		mocks.settingsGet.returns(100);
		setCacheAndDispositionHeaders(request as any, response as any);
		expect(response.setHeader.calledWith('Cache-Control', 'public, max-age=100')).to.be.true;
		expect(response.setHeader.calledWith('Content-Disposition', 'inline')).to.be.true;
	});
});

describe('#userCanAccessAvatar()', async () => {
	beforeEach(() => {
		mocks.findOneByIdAndLoginToken.reset();
		mocks.settingsGet.reset();
	});
	it('should return true if setting is set to not block avatars', async () => {
		await expect(userCanAccessAvatar({})).to.eventually.equal(true);
	});
	it('should return true if user is authenticated', async () => {
		mocks.settingsGet.returns(true);
		mocks.findOneByIdAndLoginToken.returns({ _id: 'id' });

		await expect(userCanAccessAvatar({ query: { rc_token: 'token', rc_uid: 'id' } })).to.eventually.equal(true);
		await expect(userCanAccessAvatar({ headers: { cookie: 'rc_token=token; rc_uid=id' } })).to.eventually.equal(true);
	});
	it('should return false and warn if user is unauthenticated', async () => {
		console.warn = sinon.spy();
		mocks.findOneByIdAndLoginToken.returns(undefined);
		mocks.settingsGet.returns(true);

		await expect(userCanAccessAvatar({})).to.eventually.equal(false);
		expect((console.warn as sinon.SinonSpy).calledWith(sinon.match('unauthenticated'))).to.be.true;

		await expect(userCanAccessAvatar({ headers: { cookie: 'rc_token=token; rc_uid=id' } })).to.eventually.equal(false);
		expect((console.warn as sinon.SinonSpy).calledWith(sinon.match('unauthenticated'))).to.be.true;

		await expect(userCanAccessAvatar({ query: { rc_token: 'token', rc_uid: 'id' } })).to.eventually.equal(false);
		expect((console.warn as sinon.SinonSpy).calledWith(sinon.match('unauthenticated'))).to.be.true;
	});
});
