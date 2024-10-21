import { expect } from 'chai';
import { describe, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const mocks = {
	utils: {
		userCanAccessAvatar: sinon.stub(),
		renderSVGLetters: sinon.stub(),
	},
};

const { protectAvatarsWithFallback } = proxyquire.noCallThru().load('./auth.ts', {
	'../utils': mocks.utils,
});

describe('#protectAvatarsWithFallback()', () => {
	const response = {
		setHeader: sinon.spy(),
		writeHead: sinon.spy(),
		write: sinon.spy(),
		end: sinon.spy(),
	};
	const next = sinon.spy();

	afterEach(() => {
		response.setHeader.resetHistory();
		response.writeHead.resetHistory();
		response.end.resetHistory();
		next.resetHistory();

		Object.values(mocks.utils).forEach((mock) => mock.reset());
	});

	it(`should write 404 to head if no url provided`, async () => {
		await protectAvatarsWithFallback({}, response, next);
		expect(next.called).to.be.false;
		expect(response.setHeader.called).to.be.false;
		expect(response.writeHead.calledWith(404)).to.be.true;
		expect(response.end.calledOnce).to.be.true;
	});

	it(`should write 200 to head and write fallback to body (user avatar)`, async () => {
		mocks.utils.renderSVGLetters.returns('fallback');

		await protectAvatarsWithFallback({ url: '/jon' }, response, next);
		expect(next.called).to.be.false;
		expect(response.setHeader.called).to.be.false;

		expect(response.writeHead.calledWith(200, { 'Content-Type': 'image/svg+xml' })).to.be.true;
		expect(mocks.utils.renderSVGLetters.calledWith('jon')).to.be.true;
		expect(response.write.calledWith('fallback')).to.be.true;

		expect(response.end.calledOnce).to.be.true;
	});

	it(`should write 200 to head and write fallback to body (user avatar)`, async () => {
		mocks.utils.renderSVGLetters.returns('fallback');

		await protectAvatarsWithFallback({ url: '/jon' }, response, next);
		expect(next.called).to.be.false;
		expect(response.setHeader.called).to.be.false;
		expect(response.writeHead.calledWith(200, { 'Content-Type': 'image/svg+xml' })).to.be.true;
		expect(response.write.calledWith('fallback')).to.be.true;
		expect(response.end.calledOnce).to.be.true;
	});

	it(`should write 200 to head and write fallback to body (room avatar)`, async () => {
		mocks.utils.renderSVGLetters.returns('fallback');

		await protectAvatarsWithFallback({ url: '/room/jon' }, response, next);
		expect(next.called).to.be.false;
		expect(response.setHeader.called).to.be.false;
		expect(response.writeHead.calledWith(200, { 'Content-Type': 'image/svg+xml' })).to.be.true;
		expect(response.write.calledWith('fallback')).to.be.true;
		expect(response.end.calledOnce).to.be.true;
	});

	it(`should call next if user can access avatar`, async () => {
		mocks.utils.userCanAccessAvatar.returns(true);
		const request = { url: '/jon' };

		await protectAvatarsWithFallback(request, response, next);
		expect(mocks.utils.userCanAccessAvatar.calledWith(request)).to.be.true;
		expect(next.called).to.be.true;
	});
});
