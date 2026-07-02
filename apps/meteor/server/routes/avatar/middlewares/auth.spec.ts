import type { IncomingMessage, ServerResponse } from 'node:http';

import { expect } from 'chai';
import type { NextFunction } from 'connect';
import sinon from 'sinon';
import { afterEach, describe, it, vi } from 'vitest';

const { mocks } = vi.hoisted(() => {
	const sinon = require('sinon');
	return {
		mocks: {
			utils: {
				userCanAccessAvatar: sinon.stub(),
				renderSVGLetters: sinon.stub(),
			},
		},
	};
});

vi.mock('../utils', () => mocks.utils);

const { protectAvatarsWithFallback, protectAvatars } = await import('./auth');

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
		await protectAvatarsWithFallback(
			{} as unknown as IncomingMessage,
			response as unknown as ServerResponse,
			next as unknown as NextFunction,
		);
		expect(next.called).to.be.false;
		expect(response.setHeader.called).to.be.false;
		expect(response.writeHead.calledWith(404)).to.be.true;
		expect(response.end.calledOnce).to.be.true;
	});

	it(`should write 200 to head and write fallback to body (user avatar)`, async () => {
		mocks.utils.renderSVGLetters.returns('fallback');

		await protectAvatarsWithFallback(
			{ url: '/jon' } as unknown as IncomingMessage,
			response as unknown as ServerResponse,
			next as unknown as NextFunction,
		);
		expect(next.called).to.be.false;
		expect(response.setHeader.called).to.be.false;

		expect(response.writeHead.calledWith(200, { 'Content-Type': 'image/svg+xml' })).to.be.true;
		expect(mocks.utils.renderSVGLetters.calledWith('jon')).to.be.true;
		expect(response.write.calledWith('fallback')).to.be.true;

		expect(response.end.calledOnce).to.be.true;
	});

	it(`should write 200 to head and write fallback to body (room avatar)`, async () => {
		mocks.utils.renderSVGLetters.returns('fallback');

		await protectAvatarsWithFallback(
			{ url: '/room/jon' } as unknown as IncomingMessage,
			response as unknown as ServerResponse,
			next as unknown as NextFunction,
		);
		expect(next.called).to.be.false;
		expect(response.setHeader.called).to.be.false;
		expect(response.writeHead.calledWith(200, { 'Content-Type': 'image/svg+xml' })).to.be.true;
		expect(response.write.calledWith('fallback')).to.be.true;
		expect(response.end.calledOnce).to.be.true;
	});

	it(`should call next if user can access avatar`, async () => {
		mocks.utils.userCanAccessAvatar.returns(true);
		const request = { url: '/jon' } as unknown as IncomingMessage;

		await protectAvatarsWithFallback(request, response as unknown as ServerResponse, next as unknown as NextFunction);
		expect(mocks.utils.userCanAccessAvatar.calledWith(request)).to.be.true;
		expect(next.called).to.be.true;
	});
});

describe('#protectAvatars()', () => {
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
		await protectAvatars({} as unknown as IncomingMessage, response as unknown as ServerResponse, next as unknown as NextFunction);

		expect(next.called).to.be.false;
		expect(response.setHeader.called).to.be.false;
		expect(response.writeHead.calledWith(404)).to.be.true;
		expect(response.end.calledOnce).to.be.true;
	});

	it(`should write 404 to head if access is denied`, async () => {
		mocks.utils.userCanAccessAvatar.returns(false);

		await protectAvatars(
			{ url: '/room/jon' } as unknown as IncomingMessage,
			response as unknown as ServerResponse,
			next as unknown as NextFunction,
		);

		expect(next.called).to.be.false;
		expect(response.setHeader.called).to.be.false;
		expect(response.writeHead.calledWith(404)).to.be.true;
		expect(response.end.calledOnce).to.be.true;
	});

	it(`should call next if user can access avatar`, async () => {
		mocks.utils.userCanAccessAvatar.returns(true);
		const request = { url: '/jon' } as unknown as IncomingMessage;

		await protectAvatars(request, response as unknown as ServerResponse, next as unknown as NextFunction);
		expect(mocks.utils.userCanAccessAvatar.calledWith(request)).to.be.true;
		expect(next.called).to.be.true;
	});
});
